import { useState, useEffect, useRef, Fragment, useContext } from "react";
import { streamAiChat, MAX_CHAT_IMAGES } from "../services/aiService";
import { LanguageContext } from "../context/LanguageContext";
import { ToastContext } from "../context/ToastContext";
import { getTranslations } from "../utils/translations";
import "./AiChatDrawer.css";

const SESSION_KEY = "electrostore_ai_session";
const MODEL_KEY = "electrostore_ai_model";
const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_IMAGE_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const MODEL_OPTIONS = [
    { id: "lite", label: "Lite" },
    { id: "flash", label: "Flash" },
    { id: "pro", label: "Pro" },
];

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

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

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
        <aside className="ai-chat-panel" aria-label={t.chat.title}>
            <div className="ai-chat-header">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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


// import { useState, useEffect, useRef, Fragment, useContext } from "react";
// import { streamAiChat } from "../services/aiService";
// import { LanguageContext } from "../context/LanguageContext";
// import { ToastContext } from "../context/ToastContext";
// import { getTranslations } from "../utils/translations";
// import "./AiChatDrawer.css";

// const SESSION_KEY = "electrostore_ai_session";
// const MODEL_KEY = "electrostore_ai_model";
// const SESSION_TTL_MS = 30 * 60 * 1000;

// const MODEL_OPTIONS = [
//     { id: "lite", label: "Lite" },
//     { id: "flash", label: "Flash" },
//     { id: "pro", label: "Pro" },
// ];

// const getOrCreateSessionId = () => {
//     const saved = localStorage.getItem(SESSION_KEY);
//     if (saved) {
//         try {
//             const parsed = JSON.parse(saved);
//             if (Date.now() - parsed.createdAt < SESSION_TTL_MS && parsed.id) {
//                 return parsed.id;
//             }
//         } catch {
//             // ignore corrupted storage
//         }
//     }
//     const newId = crypto.randomUUID
//         ? crypto.randomUUID()
//         : `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
//     localStorage.setItem(SESSION_KEY, JSON.stringify({ id: newId, createdAt: Date.now() }));
//     return newId;
// };

// const renderInlineBold = (text) => {
//     const parts = text.split(/(\*\*[^*]+\*\*)/g);
//     return parts.map((part, i) => {
//         if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
//             return <strong key={i}>{part.slice(2, -2)}</strong>;
//         }
//         return <Fragment key={i}>{part}</Fragment>;
//     });
// };

// const FormattedMessage = ({ content }) => {
//     const lines = content.split("\n");
//     return (
//         <>
//             {lines.map((line, idx) => (
//                 <Fragment key={idx}>
//                     {renderInlineBold(line)}
//                     {idx < lines.length - 1 && <br />}
//                 </Fragment>
//             ))}
//         </>
//     );
// };

// const AiChatDrawer = ({ isOpen, onClose }) => {
//     const {
//         language,
//         t,
//         isAiLangLocked,
//         applyAiDetectedLanguage,
//         unlockAiLanguage,
//     } = useContext(LanguageContext);
//     const { showToast } = useContext(ToastContext);

//     const [sessionId, setSessionId] = useState(() => getOrCreateSessionId());
//     const [modelType, setModelType] = useState(
//         () => localStorage.getItem(MODEL_KEY) || "flash"
//     );
//     const [messages, setMessages] = useState(() => [
//         {
//             role: "assistant",
//             content: t.chat.welcome,
//             isSystemGreeting: true,
//         },
//     ]);
//     const [input, setInput] = useState("");
//     const [isStreaming, setIsStreaming] = useState(false);
//     const messagesEndRef = useRef(null);

//     useEffect(() => {
//         setMessages((prev) => {
//             if (prev.length === 1 && prev[0].isSystemGreeting) {
//                 return [{ ...prev[0], content: t.chat.welcome }];
//             }
//             return prev;
//         });
//     }, [t.chat.welcome]);

//     useEffect(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }, [messages, isOpen]);

//     if (!isOpen) return null;

//     const handleModelChange = (nextModel) => {
//         setModelType(nextModel);
//         localStorage.setItem(MODEL_KEY, nextModel);
//     };

//     const handleResetSession = () => {
//         localStorage.removeItem(SESSION_KEY);
//         const freshId = getOrCreateSessionId();
//         setSessionId(freshId);
//         unlockAiLanguage();
//         setMessages([
//             {
//                 role: "assistant",
//                 content: t.chat.newSession,
//                 isSystemGreeting: true,
//             },
//         ]);
//     };

//     const handleSend = async (e) => {
//         e.preventDefault();
//         const trimmed = input.trim();
//         if (!trimmed || isStreaming) return;

//         const currentSession = getOrCreateSessionId();
//         setSessionId(currentSession);

//         setMessages((prev) => [
//             ...prev,
//             { role: "user", content: trimmed },
//             { role: "assistant", content: "" },
//         ]);
//         setInput("");
//         setIsStreaming(true);

//         await streamAiChat({
//             sessionId: currentSession,
//             message: trimmed,
//             modelType,
//             preferredLang: language,
//             allowUiLangSwitch: !isAiLangLocked,
//             onLanguageDetected: (detectedLang) => {
//                 const switchedTo = applyAiDetectedLanguage(detectedLang);
//                 if (switchedTo) {
//                     const targetDict = getTranslations(switchedTo);
//                     showToast(targetDict.chat.langAutoSwitchedToast, "success");
//                 }
//             },
//             onChunk: (chunk) => {
//                 setMessages((prev) => {
//                     const updated = [...prev];
//                     const lastIdx = updated.length - 1;
//                     updated[lastIdx] = {
//                         ...updated[lastIdx],
//                         content: updated[lastIdx].content + chunk,
//                     };
//                     return updated;
//                 });
//             },
//             onDone: () => {
//                 setIsStreaming(false);
//             },
//             onError: () => {
//                 setMessages((prev) => {
//                     const updated = [...prev];
//                     const lastIdx = updated.length - 1;
//                     updated[lastIdx] = {
//                         ...updated[lastIdx],
//                         content: updated[lastIdx].content || t.chat.connectionError,
//                     };
//                     return updated;
//                 });
//                 setIsStreaming(false);
//             },
//         });
//     };

//     return (
//         <aside className="ai-chat-panel" aria-label={t.chat.title}>
//             <div className="ai-chat-header">
//                 <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//                     <span>{t.chat.title}</span>
//                     {isAiLangLocked && (
//                         <span
//                             title="Auto language switch is locked after first meaningful message"
//                             style={{
//                                 fontSize: "10px",
//                                 padding: "2px 6px",
//                                 borderRadius: "4px",
//                                 background: "rgba(255,255,255,0.22)",
//                             }}
//                         >
//                             🔒 {language.toUpperCase()}
//                         </span>
//                     )}
//                 </div>
//                 <div className="ai-chat-header-actions">
//                     <select
//                         value={modelType}
//                         onChange={(e) => handleModelChange(e.target.value)}
//                         disabled={isStreaming}
//                         className="ai-chat-icon-btn"
//                         aria-label="Select AI model"
//                         style={{ color: "#fff", background: "rgba(0,0,0,0.25)" }}
//                     >
//                         {MODEL_OPTIONS.map((opt) => (
//                             <option key={opt.id} value={opt.id} style={{ color: "#222" }}>
//                                 {opt.label}
//                             </option>
//                         ))}
//                     </select>
//                     <button
//                         type="button"
//                         className="ai-chat-icon-btn"
//                         onClick={handleResetSession}
//                         title="Clear dialogue context"
//                     >
//                         {t.chat.newChat}
//                     </button>
//                     <button
//                         type="button"
//                         className="ai-chat-icon-btn"
//                         onClick={onClose}
//                         title="Collapse chat"
//                     >
//                         ✕
//                     </button>
//                 </div>
//             </div>

//             <div className="ai-chat-messages">
//                 {messages.map((msg, idx) => (
//                     <div key={idx} className={`ai-msg ${msg.role}`}>
//                         {msg.content ? (
//                             msg.role === "assistant" ? (
//                                 <FormattedMessage content={msg.content} />
//                             ) : (
//                                 msg.content
//                             )
//                         ) : isStreaming && idx === messages.length - 1 ? (
//                             "..."
//                         ) : (
//                             ""
//                         )}
//                     </div>
//                 ))}
//                 <div ref={messagesEndRef} />
//             </div>

//             <form className="ai-chat-form" onSubmit={handleSend}>
//                 <input
//                     type="text"
//                     className="ai-chat-input"
//                     placeholder={t.chat.placeholder}
//                     value={input}
//                     onChange={(e) => setInput(e.target.value)}
//                     disabled={isStreaming}
//                 />
//                 <button type="submit" className="ai-chat-send" disabled={isStreaming || !input.trim()}>
//                     {t.chat.send}
//                 </button>
//             </form>
//         </aside>
//     );
// };

// export default AiChatDrawer;