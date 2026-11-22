import en from "../locales/en.json";
import uk from "../locales/uk.json";
import pl from "../locales/pl.json";
import de from "../locales/de.json";
import es from "../locales/es.json";
import fr from "../locales/fr.json";
import it from "../locales/it.json";
import nl from "../locales/nl.json";
import da from "../locales/da.json";
import sv from "../locales/sv.json";
import cs from "../locales/cs.json";
import fi from "../locales/fi.json";
import no from "../locales/no.json";

const RAW_LOCALES = {
    en,
    uk,
    pl,
    de,
    es,
    fr,
    it,
    nl,
    da,
    sv,
    cs,
    fi,
    no,
};

const isPlainObject = (val) =>
    Boolean(val) && typeof val === "object" && !Array.isArray(val);

const deepMergeWithFallback = (baseObj, overrideObj) => {
    if (!isPlainObject(overrideObj)) return baseObj;
    const result = { ...baseObj };
    for (const key of Object.keys(overrideObj)) {
        const baseVal = baseObj[key];
        const overVal = overrideObj[key];
        if (isPlainObject(baseVal) && isPlainObject(overVal)) {
            result[key] = deepMergeWithFallback(baseVal, overVal);
        } else if (overVal !== undefined && overVal !== null && overVal !== "") {
            result[key] = overVal;
        }
    }
    return result;
};

export const TRANSLATIONS = Object.fromEntries(
    Object.entries(RAW_LOCALES).map(([code, data]) => [
        code,
        code === "en" ? en : deepMergeWithFallback(en, data),
    ])
);

export const getTranslations = (langCode) => {
    return TRANSLATIONS[langCode] || TRANSLATIONS.en;
};