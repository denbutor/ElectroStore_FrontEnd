import { API_BASE_URL } from "./api";

export const streamAiChat = async ({ sessionId, message, onChunk, onDone, onError }) => {
    const token = localStorage.getItem("access_token");
    const headers = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/ai/chat/stream`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                session_id: sessionId,
                message,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const block of lines) {
                const line = block.trim();
                if (!line.startsWith("data:")) continue;
                const data = line.replace(/^data:\s?/, "");

                if (data === "[DONE]") {
                    onDone?.();
                    return;
                }
                onChunk?.(data);
            }
        }
        onDone?.();
    } catch (err) {
        onError?.(err);
    }
};