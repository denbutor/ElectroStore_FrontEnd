import { createContext, useState, useEffect, useCallback } from "react";
import { getTranslations } from "../utils/translations";
import { isSupportedUiLang } from "../config/languages";

const LANG_STORAGE_KEY = "electrostore_ui_lang";
const AI_LOCK_STORAGE_KEY = "electrostore_ai_lang_locked";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem(LANG_STORAGE_KEY);
        return isSupportedUiLang(saved) ? saved : "en";
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

    const setManualLanguage = useCallback((nextLang) => {
        if (!isSupportedUiLang(nextLang)) return;
        setLanguage(nextLang);
    }, []);

    const applyAiDetectedLanguage = useCallback(
        (detectedLang) => {
            if (isAiLangLocked) {
                return null;
            }
            const normalized = detectedLang?.toLowerCase();
            if (!isSupportedUiLang(normalized)) {
                return null;
            }

            setIsAiLangLocked(true);

            if (normalized !== language) {
                setLanguage(normalized);
                return normalized;
            }

            return null;
        },
        [isAiLangLocked, language]
    );

    const unlockAiLanguage = useCallback(() => {
        setIsAiLangLocked(false);
    }, []);

    const t = getTranslations(language);

    return (
        <LanguageContext.Provider
            value={{
                language,
                t,
                isAiLangLocked,
                setManualLanguage,
                applyAiDetectedLanguage,
                unlockAiLanguage,
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
};

export { LanguageContext };