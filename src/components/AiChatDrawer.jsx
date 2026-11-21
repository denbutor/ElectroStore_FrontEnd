import { useState, useEffect, useRef, Fragment } from "react";
import { streamAiChat } from "../services/aiService";
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
    const [sessionId, setSessionId] = useState(() => getOrCreateSessionId());
    const [modelType, setModelType] = useState(
        () => localStorage.getItem(MODEL_KEY) || "flash"
    );
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Hi! I’m the ElectroStore AI consultant. I can help you choose electronics or compare specifications.",
        },
    ]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef(null);

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
        setMessages([
            {
                role: "assistant",
                content: "A new session has started. How can I help?",
            },
        ]);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isStreaming) return;

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
                        content: updated[lastIdx].content || "Error connecting to the AI service.",
                    };
                    return updated;
                });
                setIsStreaming(false);
            },
        });
    };

    return (
        <aside className="ai-chat-panel" aria-label="AI Assistant">
            <div className="ai-chat-header">
                <span>AI Assistant</span>
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
                        New Chat
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
                    placeholder="Ask about products..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isStreaming}
                />
                <button type="submit" className="ai-chat-send" disabled={isStreaming || !input.trim()}>
                    Send
                </button>
            </form>
        </aside>
    );
};

export default AiChatDrawer;

