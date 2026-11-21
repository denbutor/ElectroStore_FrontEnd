import { useState, useEffect, useRef, Fragment, useContext } from "react";
import { streamAiChat } from "../services/aiService";
import { LanguageContext } from "../context/LanguageContext";
import { ToastContext } from "../context/ToastContext";
import { TRANSLATIONS } from "../utils/translations";
import "./AiChatDrawer.css";

const SESSION_KEY = "electrostore_ai_session";
const MODEL_KEY = "electrostore_ai_model";
const SESSION_TTL_MS = 30 * 60 * 1000;

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
        tryAutoSwitchFromAiMessage,
        unlockAiLanguage,
    } = useContext(LanguageContext);
    const { showToast } = useContext(ToastContext);

    const [sessionId, setSessionId] = useState(() => getOrCreateSessionId());
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
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef(null);

    // Оновлюємо стартове привітання при зміні мови, якщо користувач ще не почав діалог
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
        setMessages([
            {
                role: "assistant",
                content: t.chat.newSession,
                isSystemGreeting: true,
            },
        ]);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isStreaming) return;

        // Автоматичне визначення і перемикання мови на першому змістовному повідомленні (> 3 слів)
        const switchedTo = tryAutoSwitchFromAiMessage(trimmed);
        const effectiveLang = switchedTo || language;
        if (switchedTo) {
            const targetDict = TRANSLATIONS[switchedTo] || t;
            showToast(targetDict.chat.langAutoSwitchedToast, "success");
        }

        const currentSession = getOrCreateSessionId();
        setSessionId(currentSession);

        setMessages((prev) => [
            ...prev,
            { role: "user", content: trimmed },
            { role: "assistant", content: "" },
        ]);
        setInput("");
        setIsStreaming(true);

        await streamAiChat({
            sessionId: currentSession,
            message: trimmed,
            modelType,
            preferredLang: effectiveLang,
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

    return (
        <aside className="ai-chat-panel" aria-label={t.chat.title}>
            <div className="ai-chat-header">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>{t.chat.title}</span>
                    {isAiLangLocked && (
                        <span
                            title="Auto language switch is locked after first meaningful message"
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

            <form className="ai-chat-form" onSubmit={handleSend}>
                <input
                    type="text"
                    className="ai-chat-input"
                    placeholder={t.chat.placeholder}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isStreaming}
                />
                <button type="submit" className="ai-chat-send" disabled={isStreaming || !input.trim()}>
                    {t.chat.send}
                </button>
            </form>
        </aside>
    );
};

export default AiChatDrawer;
