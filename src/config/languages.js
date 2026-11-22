export const UI_LANGUAGES = [
    { code: "en", shortLabel: "EN", nativeName: "English", localeTag: "en-US" },
    { code: "uk", shortLabel: "UA", nativeName: "Українська", localeTag: "uk-UA" },
    { code: "pl", shortLabel: "PL", nativeName: "Polski", localeTag: "pl-PL" },
    { code: "de", shortLabel: "DE", nativeName: "Deutsch", localeTag: "de-DE" },
    { code: "es", shortLabel: "ES", nativeName: "Español", localeTag: "es-ES" },
    { code: "fr", shortLabel: "FR", nativeName: "Français", localeTag: "fr-FR" },
    { code: "it", shortLabel: "IT", nativeName: "Italiano", localeTag: "it-IT" },
    { code: "nl", shortLabel: "NL", nativeName: "Nederlands", localeTag: "nl-NL" },
    { code: "da", shortLabel: "DA", nativeName: "Dansk", localeTag: "da-DK" },
    { code: "sv", shortLabel: "SV", nativeName: "Svenska", localeTag: "sv-SE" },
    { code: "cs", shortLabel: "CS", nativeName: "Čeština", localeTag: "cs-CZ" },
    { code: "fi", shortLabel: "FI", nativeName: "Suomi", localeTag: "fi-FI" },
    { code: "no", shortLabel: "NO", nativeName: "Norsk", localeTag: "nb-NO" },
];

export const SUPPORTED_UI_LANG_CODES = new Set(UI_LANGUAGES.map((l) => l.code));

export const isSupportedUiLang = (code) =>
    typeof code === "string" && SUPPORTED_UI_LANG_CODES.has(code.toLowerCase());

export const getLocaleTag = (code) => {
    const found = UI_LANGUAGES.find((l) => l.code === code);
    return found ? found.localeTag : "en-US";
};