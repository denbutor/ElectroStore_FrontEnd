const CYRILLIC_WORD_RE = /[а-яіїєґА-ЯІЇЄҐ]{2,}/g;
const LATIN_WORD_RE = /[a-zA-Z]{2,}/g;

// Службові/розмовні англійські слова, щоб відрізнити англійське речення від самої назви товару
const EN_COMMON_WORDS = new Set([
    "the", "is", "are", "for", "with", "and", "or", "to", "in", "on", "of",
    "what", "which", "how", "can", "will", "does", "do", "best", "good",
    "better", "compare", "difference", "between", "recommend", "need", "want",
    "buy", "price", "stock", "compatible", "compatibility", "work", "gaming",
    "laptop", "build", "pc", "please", "help", "me", "find", "show", "tell",
    "about", "this", "that", "these", "those", "my", "you", "your", "have",
]);

/**
 * Аналізує повідомлення користувача у чаті.
 * Повертає "uk" | "en", якщо повідомлення змістовне (> 3 слів), інакше null.
 */
export const detectMeaningfulMessageLanguage = (text) => {
    const cleaned = (text || "").trim();
    if (!cleaned) return null;

    // Усі слова (літери будь-якого алфавіту, довжина >= 2)
    const allWords = cleaned.match(/[a-zA-Zа-яіїєґА-ЯІЇЄҐ]{2,}/g) || [];
    if (allWords.length <= 3) {
        return null;
    }

    const cyrillicWords = cleaned.match(CYRILLIC_WORD_RE) || [];
    const latinWords = cleaned.match(LATIN_WORD_RE) || [];

    // Якщо є кирилиця (наприклад: "Підкажи чи підійде AMD Ryzen 7 9800X3D") -> українська
    if (cyrillicWords.length >= 2) {
        return "uk";
    }

    // Якщо кирилиці немає — перевіряємо, що це справді англійська фраза (> 3 слів і є розмовні/граматичні слова)
    if (cyrillicWords.length === 0 && latinWords.length > 3) {
        const hasEnglishMarkers = latinWords.some((w) =>
            EN_COMMON_WORDS.has(w.toLowerCase())
        );
        if (hasEnglishMarkers || latinWords.length >= 5) {
            return "en";
        }
    }

    return null;
};