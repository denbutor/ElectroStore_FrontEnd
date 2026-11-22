import { API_BASE_URL } from "./api";
import { SUPPORTED_UI_LANG_CODES } from "../config/languages";

const UI_LANG_TAG_RE = /^\s*\[\[UI_LANG\s*:\s*([a-zA-Z_-]+)\]\]\s*(?:\r?\n)?/i;
const MAX_PREFIX_BUFFER_LEN = 40;
export const MAX_CHAT_IMAGES = 4;

const parseSseBlock = (block) => {
    const rawLines = block.split(/\r?\n/);
    const dataLines = [];

    for (const rawLine of rawLines) {
        if (!rawLine.startsWith("data:")) continue;
        dataLines.push(rawLine.replace(/^data:\s?/, ""));
    }

    if (dataLines.length === 0) return null;
    return dataLines.join("\n");
};

export const streamAiChat = async ({
    sessionId,
    message = "",
    images = [],
    modelType = "flash",
    preferredLang = "en",
    allowUiLangSwitch = true,
    onLanguageDetected,
    onChunk,
    onDone,
    onError,
}) => {
    const safeImages = Array.isArray(images) ? images.slice(0, MAX_CHAT_IMAGES) : [];
    const token = localStorage.getItem("access_token");
    const headers = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let checkingPrefix = Boolean(allowUiLangSwitch);
    let prefixBuffer = "";

    const handleIncomingText = (textChunk) => {
        if (!textChunk) return;

        if (!checkingPrefix) {
            onChunk?.(textChunk);
            return;
        }

        prefixBuffer += textChunk;
        const trimmedStart = prefixBuffer.trimStart();

        if (trimmedStart.length > 0 && !trimmedStart.startsWith("[")) {
            checkingPrefix = false;
            const toEmit = prefixBuffer;
            prefixBuffer = "";
            onChunk?.(toEmit);
            return;
        }

        if (trimmedStart.length >= 2 && !trimmedStart.startsWith("[[")) {
            checkingPrefix = false;
            const toEmit = prefixBuffer;
            prefixBuffer = "";
            onChunk?.(toEmit);
            return;
        }

        const match = prefixBuffer.match(UI_LANG_TAG_RE);
        if (match) {
            checkingPrefix = false;
            const rawLang = match[1].toLowerCase();
            if (SUPPORTED_UI_LANG_CODES.has(rawLang)) {
                onLanguageDetected?.(rawLang);
            }
            const remaining = prefixBuffer.slice(match[0].length);
            prefixBuffer = "";
            if (remaining) {
                onChunk?.(remaining);
            }
            return;
        }

        if (prefixBuffer.length > MAX_PREFIX_BUFFER_LEN) {
            checkingPrefix = false;
            const toEmit = prefixBuffer;
            prefixBuffer = "";
            onChunk?.(toEmit);
        }
    };

    const flushRemainingBuffer = () => {
        if (checkingPrefix && prefixBuffer) {
            checkingPrefix = false;
            const cleaned = prefixBuffer.replace(UI_LANG_TAG_RE, "");
            prefixBuffer = "";
            if (cleaned) {
                onChunk?.(cleaned);
            }
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/ai/chat/stream`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                session_id: sessionId,
                message,
                images: safeImages.map((img) => ({
                    mime_type: img.mimeType,
                    data: img.data,
                })),
                model_type: modelType,
                preferred_lang: preferredLang,
                allow_ui_lang_switch: allowUiLangSwitch,
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
                    flushRemainingBuffer();
                    finished = true;
                    onDone?.();
                    return;
                }

                handleIncomingText(parsed);
            }
        }

        if (buffer.trim()) {
            const tail = parseSseBlock(buffer);
            if (tail && tail.trim() !== "[DONE]") {
                handleIncomingText(tail);
            }
        }

        if (!finished) {
            flushRemainingBuffer();
            onDone?.();
        }
    } catch (err) {
        flushRemainingBuffer();
        onError?.(err);
    }
};

// import { API_BASE_URL } from "./api";
// import { SUPPORTED_UI_LANG_CODES } from "../config/languages";

// const UI_LANG_TAG_RE = /^\s*\[\[UI_LANG\s*:\s*([a-zA-Z_-]+)\]\]\s*(?:\r?\n)?/i;
// const MAX_PREFIX_BUFFER_LEN = 40;

// const parseSseBlock = (block) => {
//     const rawLines = block.split(/\r?\n/);
//     const dataLines = [];

//     for (const rawLine of rawLines) {
//         if (!rawLine.startsWith("data:")) continue;
//         dataLines.push(rawLine.replace(/^data:\s?/, ""));
//     }

//     if (dataLines.length === 0) return null;
//     return dataLines.join("\n");
// };

// export const streamAiChat = async ({
//     sessionId,
//     message,
//     modelType = "flash",
//     preferredLang = "en",
//     allowUiLangSwitch = true,
//     onLanguageDetected,
//     onChunk,
//     onDone,
//     onError,
// }) => {
//     const token = localStorage.getItem("access_token");
//     const headers = {
//         "Content-Type": "application/json",
//     };
//     if (token) {
//         headers.Authorization = `Bearer ${token}`;
//     }

//     let checkingPrefix = Boolean(allowUiLangSwitch);
//     let prefixBuffer = "";

//     const handleIncomingText = (textChunk) => {
//         if (!textChunk) return;

//         if (!checkingPrefix) {
//             onChunk?.(textChunk);
//             return;
//         }

//         prefixBuffer += textChunk;
//         const trimmedStart = prefixBuffer.trimStart();

//         if (trimmedStart.length > 0 && !trimmedStart.startsWith("[")) {
//             checkingPrefix = false;
//             const toEmit = prefixBuffer;
//             prefixBuffer = "";
//             onChunk?.(toEmit);
//             return;
//         }

//         if (trimmedStart.length >= 2 && !trimmedStart.startsWith("[[")) {
//             checkingPrefix = false;
//             const toEmit = prefixBuffer;
//             prefixBuffer = "";
//             onChunk?.(toEmit);
//             return;
//         }

//         const match = prefixBuffer.match(UI_LANG_TAG_RE);
//         if (match) {
//             checkingPrefix = false;
//             const rawLang = match[1].toLowerCase();
//             if (SUPPORTED_UI_LANG_CODES.has(rawLang)) {
//                 onLanguageDetected?.(rawLang);
//             }
//             const remaining = prefixBuffer.slice(match[0].length);
//             prefixBuffer = "";
//             if (remaining) {
//                 onChunk?.(remaining);
//             }
//             return;
//         }

//         if (prefixBuffer.length > MAX_PREFIX_BUFFER_LEN) {
//             checkingPrefix = false;
//             const toEmit = prefixBuffer;
//             prefixBuffer = "";
//             onChunk?.(toEmit);
//         }
//     };

//     const flushRemainingBuffer = () => {
//         if (checkingPrefix && prefixBuffer) {
//             checkingPrefix = false;
//             const cleaned = prefixBuffer.replace(UI_LANG_TAG_RE, "");
//             prefixBuffer = "";
//             if (cleaned) {
//                 onChunk?.(cleaned);
//             }
//         }
//     };

//     try {
//         const response = await fetch(`${API_BASE_URL}/api/v1/ai/chat/stream`, {
//             method: "POST",
//             headers,
//             body: JSON.stringify({
//                 session_id: sessionId,
//                 message,
//                 model_type: modelType,
//                 preferred_lang: preferredLang,
//                 allow_ui_lang_switch: allowUiLangSwitch,
//             }),
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error ${response.status}`);
//         }

//         const reader = response.body.getReader();
//         const decoder = new TextDecoder("utf-8");
//         let buffer = "";
//         let finished = false;

//         while (true) {
//             const { value, done } = await reader.read();
//             if (done) break;

//             buffer += decoder.decode(value, { stream: true });
//             const blocks = buffer.split(/\r?\n\r?\n/);
//             buffer = blocks.pop() || "";

//             for (const block of blocks) {
//                 const parsed = parseSseBlock(block);
//                 if (parsed === null) continue;

//                 if (parsed.trim() === "[DONE]") {
//                     flushRemainingBuffer();
//                     finished = true;
//                     onDone?.();
//                     return;
//                 }

//                 handleIncomingText(parsed);
//             }
//         }

//         if (buffer.trim()) {
//             const tail = parseSseBlock(buffer);
//             if (tail && tail.trim() !== "[DONE]") {
//                 handleIncomingText(tail);
//             }
//         }

//         if (!finished) {
//             flushRemainingBuffer();
//             onDone?.();
//         }
//     } catch (err) {
//         flushRemainingBuffer();
//         onError?.(err);
//     }
// };