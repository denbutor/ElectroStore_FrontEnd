import { createContext, useState, useEffect, useCallback } from "react";
import { TRANSLATIONS } from "../utils/translations";
import { detectMeaningfulMessageLanguage } from "../utils/languageDetector";

const LANG_STORAGE_KEY = "electrostore_ui_lang";
const AI_LOCK_STORAGE_KEY = "electrostore_ai_lang_locked";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem(LANG_STORAGE_KEY);
        return saved === "uk" || saved === "en" ? saved : "en";
    });

    const [isAiLangLocked, setIsAiLangLocked] = useState(() => {
        return localStorage.getItem(AI_LOCK_STORAGE_KEY) === "true";
    });

    useEffect(() => {
        localStorage.setItem(LANG_STORAGE_KEY, language);
        document.documentElement.lang = language;
    }, [language]);

    useEffect(() => {
        localStorage.setItem(AI_LOCK_STORAGE_KEY, String(isAiLangLocked));
    }, [isAiLangLocked]);

    /**
     * Ручна зміна мови через перемикач у хедері (завжди доступна).
     */
    const setManualLanguage = useCallback((nextLang) => {
        if (nextLang !== "en" && nextLang !== "uk") return;
        setLanguage(nextLang);
    }, []);

    /**
     * Спроба автоматично змінити мову за першим змістовним повідомленням у чаті (> 3 слів).
     * Після першого змістовного повідомлення блокує подальшу автозміну через AI-чат.
     * Повертає нову мову ("en" | "uk"), якщо мова змінилася, інакше null.
     */
    const tryAutoSwitchFromAiMessage = useCallback(
        (messageText) => {
            if (isAiLangLocked) {
                return null;
            }

            const detectedLang = detectMeaningfulMessageLanguage(messageText);
            if (!detectedLang) {
                // Повідомлення коротке (<= 3 слів) — ще не блокуємо і не перемикаємо
                return null;
            }

            // Блокуємо подальшу автозміну мови через асистента після першого змістовного повідомлення
            setIsAiLangLocked(true);

            if (detectedLang !== language) {
                setLanguage(detectedLang);
                return detectedLang;
            }

            return null;
        },
        [isAiLangLocked, language]
    );

    /**
     * Скидає блокування при натисканні "New Chat" в асистенті.
     */
    const unlockAiLanguage = useCallback(() => {
        setIsAiLangLocked(false);
    }, []);

    const t = TRANSLATIONS[language] || TRANSLATIONS.en;

    return (
        <LanguageContext.Provider
            value={{
                language,
                t,
                isAiLangLocked,
                setManualLanguage,
                tryAutoSwitchFromAiMessage,
                unlockAiLanguage,
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
};

export { LanguageContext };