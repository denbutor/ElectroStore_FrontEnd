import { useState, useEffect, useRef } from "react";
import { streamAiChat } from "../services/aiService";
import "./AiChatDrawer.css";

const SESSION_KEY = "electrostore_ai_session";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 хв як у Redis

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

const AiChatDrawer = ({ isOpen, onClose }) => {
    const [sessionId, setSessionId] = useState(() => getOrCreateSessionId());
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Hi! I’m the ElectroStore AI consultant. I can help you choose electronics or compare specifications..",
        },
    ]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    if (!isOpen) return null;

    const handleResetSession = () => {
        localStorage.removeItem(SESSION_KEY);
        const freshId = getOrCreateSessionId();
        setSessionId(freshId);
        setMessages([
            {
                role: "assistant",
                content: "A new session has started. How can I help??",
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
                        content: updated[lastIdx].content || "Error connecting to the AI ​​service.",
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
                        {msg.content || (isStreaming && idx === messages.length - 1 ? "..." : "")}
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