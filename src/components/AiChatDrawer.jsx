import { useState, useEffect, useRef, useCallback, Fragment, useContext } from "react";
import { streamAiChat, MAX_CHAT_IMAGES } from "../services/aiService";
import { LanguageContext } from "../context/LanguageContext";
import { ToastContext } from "../context/ToastContext";
import { getTranslations } from "../utils/translations";
import "./AiChatDrawer.css";

const SESSION_KEY = "electrostore_ai_session";
const MODEL_KEY = "electrostore_ai_model";
const SIZE_KEY = "electrostore_ai_drawer_size";
const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_IMAGE_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Межі розмірів: менший мінімум за колишні 390x550 і розумний максимум
const MIN_WIDTH = 280;
const MIN_HEIGHT = 340;
const DEFAULT_WIDTH = 390;
const DEFAULT_HEIGHT = 550;
const MAX_WIDTH_CAP = 780;
const RIGHT_OFFSET = 16;
const BOTTOM_OFFSET = 16;

const MODEL_OPTIONS = [
    { id: "lite", label: "Lite" },
    { id: "flash", label: "Flash" },
    { id: "pro", label: "Pro" },
];

const getHeaderOffset = () => {
    if (typeof window === "undefined") return 80;
    const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--header-height")
        .trim();
    const parsed = parseFloat(raw);
    const headerHeight = Number.isFinite(parsed) && parsed > 0 ? parsed : 68;
    return headerHeight + 12;
};

const getMaxBounds = () => {
    if (typeof window === "undefined") {
        return { maxWidth: MAX_WIDTH_CAP, maxHeight: 720 };
    }
    const topOffset = getHeaderOffset();
    const availableWidth = Math.max(MIN_WIDTH, window.innerWidth - RIGHT_OFFSET - 12);
    const availableHeight = Math.max(
        MIN_HEIGHT,
        window.innerHeight - topOffset - BOTTOM_OFFSET
    );
    return {
        maxWidth: Math.min(MAX_WIDTH_CAP, availableWidth),
        maxHeight: availableHeight,
    };
};

const clampSize = (width, height) => {
    const { maxWidth, maxHeight } = getMaxBounds();
    const effectiveMinW = Math.min(MIN_WIDTH, maxWidth);
    const effectiveMinH = Math.min(MIN_HEIGHT, maxHeight);
    return {
        width: Math.round(Math.min(Math.max(width, effectiveMinW), maxWidth)),
        height: Math.round(Math.min(Math.max(height, effectiveMinH), maxHeight)),
    };
};

const getInitialSize = () => {
    if (typeof window === "undefined") {
        return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
    }
    try {
        const saved = JSON.parse(localStorage.getItem(SIZE_KEY) || "null");
        if (saved && typeof saved.width === "number" && typeof saved.height === "number") {
            return clampSize(saved.width, saved.height);
        }
    } catch {
        // ignore invalid stored dimensions
    }
    const mobileWidth = window.innerWidth < 640 ? window.innerWidth - 20 : DEFAULT_WIDTH;
    return clampSize(mobileWidth, DEFAULT_HEIGHT);
};

const getOrCreateSessionId = () => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Date.now() - parsed.createdAt < SESSION_TTL_MS && parsed.id) {
                return parsed.id;
            }
        } catch {
            // ignore corrupted storage
        }
    }
    const newId = crypto.randomUUID
        ? crypto.randomUUID()
        : `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: newId, createdAt: Date.now() }));
    return newId;
};

const compressImageFile = (file) =>
    new Promise((resolve, reject) => {
        const mimeType = ALLOWED_MIME_TYPES.has(file.type) ? file.type : "image/jpeg";
        const outputMime = mimeType === "image/png" ? "image/png" : "image/jpeg";
        const reader = new FileReader();

        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error("Invalid image file"));
            img.onload = () => {
                let { width, height } = img;
                if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
                    const scale = Math.min(
                        MAX_IMAGE_DIMENSION / width,
                        MAX_IMAGE_DIMENSION / height
                    );
                    width = Math.max(1, Math.round(width * scale));
                    height = Math.max(1, Math.round(height * scale));
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Canvas context unavailable"));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl =
                    outputMime === "image/png"
                        ? canvas.toDataURL("image/png")
                        : canvas.toDataURL("image/jpeg", JPEG_QUALITY);

                const base64Part = dataUrl.split(",")[1] || "";
                resolve({
                    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                    mimeType: outputMime,
                    data: base64Part,
                    previewUrl: dataUrl,
                });
            };
            img.src = String(reader.result || "");
        };

        reader.readAsDataURL(file);
    });

const renderInlineBold = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <Fragment key={i}>{part}</Fragment>;
    });
};

const FormattedMessage = ({ content }) => {
    const lines = content.split("\n");
    return (
        <>
            {lines.map((line, idx) => (
                <Fragment key={idx}>
                    {renderInlineBold(line)}
                    {idx < lines.length - 1 && <br />}
                </Fragment>
            ))}
        </>
    );
};

const AiChatDrawer = ({ isOpen, onClose }) => {
    const {
        language,
        t,
        isAiLangLocked,
        applyAiDetectedLanguage,
        unlockAiLanguage,
    } = useContext(LanguageContext);
    const { showToast } = useContext(ToastContext);

    const [, setSessionId] = useState(() => getOrCreateSessionId());
    const [modelType, setModelType] = useState(
        () => localStorage.getItem(MODEL_KEY) || "flash"
    );
    const [messages, setMessages] = useState(() => [
        {
            role: "assistant",
            content: t.chat.welcome,
            isSystemGreeting: true,
        },
    ]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);

    const [panelSize, setPanelSize] = useState(getInitialSize);
    const [resizeEdge, setResizeEdge] = useState(null);

    const panelRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const dragStateRef = useRef(null);

    useEffect(() => {
        setMessages((prev) => {
            if (prev.length === 1 && prev[0].isSystemGreeting) {
                return [{ ...prev[0], content: t.chat.welcome }];
            }
            return prev;
        });
    }, [t.chat.welcome]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleWindowResize = () => {
            setPanelSize((prev) => clampSize(prev.width, prev.height));
        };
        handleWindowResize();
        window.addEventListener("resize", handleWindowResize);
        return () => window.removeEventListener("resize", handleWindowResize);
    }, [isOpen]);

    const handleResizeStart = useCallback(
        (edge) => (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();

            dragStateRef.current = {
                edge,
                startX: e.clientX,
                startY: e.clientY,
                startWidth: panelSize.width,
                startHeight: panelSize.height,
            };
            setResizeEdge(edge);

            const handlePointerMove = (moveEvent) => {
                const state = dragStateRef.current;
                if (!state) return;

                // Права й верхня сторони зафіксовані:
                // - лівий край рухається вліво (dx < 0) => ширина зростає
                // - нижній край рухається вниз (dy > 0) => висота зростає
                const dx = moveEvent.clientX - state.startX;
                const dy = moveEvent.clientY - state.startY;

                let nextWidth = state.startWidth;
                let nextHeight = state.startHeight;

                if (state.edge === "left" || state.edge === "bottom-left") {
                    nextWidth = state.startWidth - dx;
                }
                if (state.edge === "bottom" || state.edge === "bottom-left") {
                    nextHeight = state.startHeight + dy;
                }

                setPanelSize(clampSize(nextWidth, nextHeight));
            };

            const handlePointerUp = () => {
                dragStateRef.current = null;
                setResizeEdge(null);
                window.removeEventListener("pointermove", handlePointerMove);
                window.removeEventListener("pointerup", handlePointerUp);
                window.removeEventListener("pointercancel", handlePointerUp);

                setPanelSize((current) => {
                    try {
                        localStorage.setItem(SIZE_KEY, JSON.stringify(current));
                    } catch {
                        // ignore storage quota errors
                    }
                    return current;
                });
            };

            window.addEventListener("pointermove", handlePointerMove);
            window.addEventListener("pointerup", handlePointerUp);
            window.addEventListener("pointercancel", handlePointerUp);
        },
        [panelSize.height, panelSize.width]
    );

    if (!isOpen) return null;

    const handleModelChange = (nextModel) => {
        setModelType(nextModel);
        localStorage.setItem(MODEL_KEY, nextModel);
    };

    const handleResetSession = () => {
        localStorage.removeItem(SESSION_KEY);
        const freshId = getOrCreateSessionId();
        setSessionId(freshId);
        unlockAiLanguage();
        setSelectedImages([]);
        setMessages([
            {
                role: "assistant",
                content: t.chat.newSession,
                isSystemGreeting: true,
            },
        ]);
    };

    const handleGalleryChange = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (!files.length || isStreaming) return;

        const remainingSlots = MAX_CHAT_IMAGES - selectedImages.length;
        if (remainingSlots <= 0) {
            showToast(
                (t.chat.maxImagesError || "Max {max} photos per message").replace(
                    "{max}",
                    String(MAX_CHAT_IMAGES)
                ),
                "error"
            );
            return;
        }

        const toProcess = files.slice(0, remainingSlots);
        if (files.length > remainingSlots) {
            showToast(
                (t.chat.maxImagesError || "Max {max} photos per message").replace(
                    "{max}",
                    String(MAX_CHAT_IMAGES)
                ),
                "error"
            );
        }

        const compressedList = [];
        for (const file of toProcess) {
            if (!ALLOWED_MIME_TYPES.has(file.type)) {
                showToast(
                    t.chat.unsupportedFormatError || "Supported formats: JPEG, PNG, WEBP",
                    "error"
                );
                continue;
            }
            try {
                const processed = await compressImageFile(file);
                compressedList.push(processed);
            } catch {
                showToast(
                    t.chat.imageProcessError || "Failed to process image",
                    "error"
                );
            }
        }

        if (compressedList.length > 0) {
            setSelectedImages((prev) => [...prev, ...compressedList].slice(0, MAX_CHAT_IMAGES));
        }
    };

    const handleRemoveDraftImage = (id) => {
        setSelectedImages((prev) => prev.filter((item) => item.id !== id));
    };

    const handleSend = async (e) => {
        e.preventDefault();
        const trimmed = input.trim();
        const imagesToSend = [...selectedImages];
        if ((!trimmed && imagesToSend.length === 0) || isStreaming) return;

        const currentSession = getOrCreateSessionId();
        setSessionId(currentSession);

        setMessages((prev) => [
            ...prev,
            {
                role: "user",
                content: trimmed,
                images: imagesToSend.map((img) => ({
                    id: img.id,
                    previewUrl: img.previewUrl,
                })),
            },
            { role: "assistant", content: "" },
        ]);
        setInput("");
        setSelectedImages([]);
        setIsStreaming(true);

        await streamAiChat({
            sessionId: currentSession,
            message: trimmed,
            images: imagesToSend,
            modelType,
            preferredLang: language,
            allowUiLangSwitch: !isAiLangLocked,
            onLanguageDetected: (detectedLang) => {
                const switchedTo = applyAiDetectedLanguage(detectedLang);
                if (switchedTo) {
                    const targetDict = getTranslations(switchedTo);
                    showToast(targetDict.chat.langAutoSwitchedToast, "success");
                }
            },
            onChunk: (chunk) => {
                setMessages((prev) => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    updated[lastIdx] = {
                        ...updated[lastIdx],
                        content: updated[lastIdx].content + chunk,
                    };
                    return updated;
                });
            },
            onDone: () => {
                setIsStreaming(false);
            },
            onError: () => {
                setMessages((prev) => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    updated[lastIdx] = {
                        ...updated[lastIdx],
                        content: updated[lastIdx].content || t.chat.connectionError,
                    };
                    return updated;
                });
                setIsStreaming(false);
            },
        });
    };

    const canSubmit = !isStreaming && (Boolean(input.trim()) || selectedImages.length > 0);

    return (
        <aside
            ref={panelRef}
            className={`ai-chat-panel ${resizeEdge ? `is-resizing resize-mode-${resizeEdge}` : ""}`}
            style={{
                width: `${panelSize.width}px`,
                height: `${panelSize.height}px`,
            }}
            aria-label={t.chat.title}
        >
            <div
                className="ai-resize-handle ai-resize-left"
                onPointerDown={handleResizeStart("left")}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize assistant width from left"
            />
            <div
                className="ai-resize-handle ai-resize-bottom"
                onPointerDown={handleResizeStart("bottom")}
                role="separator"
                aria-orientation="horizontal"
                aria-label="Resize assistant height from bottom"
            />
            <div
                className="ai-resize-handle ai-resize-bottom-left"
                onPointerDown={handleResizeStart("bottom-left")}
                role="separator"
                aria-label="Resize assistant from bottom-left corner"
            />

            <div className="ai-chat-header">
                <div className="ai-chat-title-group">
                    <span>{t.chat.title}</span>
                    {isAiLangLocked && (
                        <span
                            title={t.chat.langLockedBadge || "Lang locked"}
                            style={{
                                fontSize: "10px",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: "rgba(255,255,255,0.22)",
                            }}
                        >
                            🔒 {language.toUpperCase()}
                        </span>
                    )}
                </div>
                <div className="ai-chat-header-actions">
                    <select
                        value={modelType}
                        onChange={(e) => handleModelChange(e.target.value)}
                        disabled={isStreaming}
                        className="ai-chat-icon-btn"
                        aria-label="Select AI model"
                        style={{ color: "#fff", background: "rgba(0,0,0,0.25)" }}
                    >
                        {MODEL_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id} style={{ color: "#222" }}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        className="ai-chat-icon-btn"
                        onClick={handleResetSession}
                        title="Clear dialogue context"
                    >
                        {t.chat.newChat}
                    </button>
                    <button
                        type="button"
                        className="ai-chat-icon-btn"
                        onClick={onClose}
                        title="Collapse chat"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <div className="ai-chat-messages">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`ai-msg ${msg.role}`}>
                        {Array.isArray(msg.images) && msg.images.length > 0 && (
                            <div className="ai-msg-images">
                                {msg.images.map((img) => (
                                    <img
                                        key={img.id}
                                        src={img.previewUrl}
                                        alt="Attached"
                                        className="ai-msg-thumb"
                                    />
                                ))}
                            </div>
                        )}
                        {msg.content ? (
                            msg.role === "assistant" ? (
                                <FormattedMessage content={msg.content} />
                            ) : (
                                msg.content
                            )
                        ) : isStreaming && idx === messages.length - 1 ? (
                            "..."
                        ) : (
                            ""
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {selectedImages.length > 0 && (
                <div className="ai-chat-draft-attachments">
                    {selectedImages.map((img) => (
                        <div key={img.id} className="ai-draft-item">
                            <img src={img.previewUrl} alt="Preview" className="ai-draft-thumb" />
                            <button
                                type="button"
                                className="ai-draft-remove-btn"
                                onClick={() => handleRemoveDraftImage(img.id)}
                                disabled={isStreaming}
                                aria-label={t.chat.removePhoto || "Remove photo"}
                                title={t.chat.removePhoto || "Remove photo"}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <form className="ai-chat-form" onSubmit={handleSend}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    hidden
                    onChange={handleGalleryChange}
                    disabled={isStreaming}
                />
                <button
                    type="button"
                    className="ai-chat-gallery-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isStreaming || selectedImages.length >= MAX_CHAT_IMAGES}
                    title={t.chat.attachPhoto || "Attach from gallery"}
                    aria-label={t.chat.attachPhoto || "Attach from gallery"}
                >
                    🖼️
                </button>
                <input
                    type="text"
                    className="ai-chat-input"
                    placeholder={t.chat.placeholder}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isStreaming}
                />
                <button type="submit" className="ai-chat-send" disabled={!canSubmit}>
                    {t.chat.send}
                </button>
            </form>
        </aside>
    );
};

export default AiChatDrawer;
