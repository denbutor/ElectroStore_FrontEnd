import { API_BASE_URL } from "./api";

const parseSseBlock = (block) => {
    const rawLines = block.split(/\r?\n/);
    const dataLines = [];

    for (const rawLine of rawLines) {
        if (!rawLine.startsWith("data:")) continue;
        // У SSE після "data:" може бути один опціональний пробіл
        dataLines.push(rawLine.replace(/^data:\s?/, ""));
    }

    if (dataLines.length === 0) return null;
    return dataLines.join("\n");
};

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
        let finished = false;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const blocks = buffer.split(/\r?\n\r?\n/);
            buffer = blocks.pop() || "";

            for (const block of blocks) {
                const parsed = parseSseBlock(block);
                if (parsed === null) continue;

                if (parsed.trim() === "[DONE]") {
                    finished = true;
                    onDone?.();
                    return;
                }

                onChunk?.(parsed);
            }
        }

        if (buffer.trim()) {
            const tail = parseSseBlock(buffer);
            if (tail && tail.trim() !== "[DONE]") {
                onChunk?.(tail);
            }
        }

        if (!finished) {
            onDone?.();
        }
    } catch (err) {
        onError?.(err);
    }
};

// import { API_BASE_URL } from "./api";

// export const streamAiChat = async ({ sessionId, message, onChunk, onDone, onError }) => {
//     const token = localStorage.getItem("access_token");
//     const headers = {
//         "Content-Type": "application/json",
//     };
//     if (token) {
//         headers.Authorization = `Bearer ${token}`;
//     }

//     try {
//         const response = await fetch(`${API_BASE_URL}/api/v1/ai/chat/stream`, {
//             method: "POST",
//             headers,
//             body: JSON.stringify({
//                 session_id: sessionId,
//                 message,
//             }),
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error ${response.status}`);
//         }

//         const reader = response.body.getReader();
//         const decoder = new TextDecoder("utf-8");
//         let buffer = "";

//         while (true) {
//             const { value, done } = await reader.read();
//             if (done) break;

//             buffer += decoder.decode(value, { stream: true });
//             const lines = buffer.split("\n\n");
//             buffer = lines.pop() || "";

//             for (const block of lines) {
//                 const line = block.trim();
//                 if (!line.startsWith("data:")) continue;
//                 const data = line.replace(/^data:\s?/, "");

//                 if (data === "[DONE]") {
//                     onDone?.();
//                     return;
//                 }
//                 onChunk?.(data);
//             }
//         }
//         onDone?.();
//     } catch (err) {
//         onError?.(err);
//     }
// };