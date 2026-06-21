import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import {
  LanguageCode,
  TRANSLATIONS,
  LANGUAGES_CONFIG,
  LanguageConfig,
} from "./translations";
import { CHARTER_FORM_TRANSLATIONS } from "./components/charterFormTranslations";

interface LanguageContextProps {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  isRtl: boolean;
  languages: LanguageConfig[];
}

const LanguageContext = createContext<LanguageContextProps | undefined>(
  undefined,
);

/**
 * Custom hook to detect the user's browser language on first load
 * and automatically set the default site language if not explicitly set already.
 */
export const useBrowserLanguageDetection = (
  language: LanguageCode,
  setLanguage: (lang: LanguageCode) => void,
) => {
  const hasDetected = useRef(false);

  useEffect(() => {
    if (hasDetected.current) return;
    hasDetected.current = true;

    // Only auto-detect if the user has not already selected a preferred language manually
    let storedPreferred: string | null = null;
    try {
      storedPreferred = localStorage.getItem("preferred_lang");
    } catch (e) {
      console.warn("Could not read from localStorage:", e);
    }

    if (!storedPreferred) {
      const detectedLang = (() => {
        // Try the multiple languages requested by the browser
        if (typeof navigator !== "undefined" && navigator.languages) {
          for (const rawLang of navigator.languages) {
            const cleanLang = rawLang
              .split("-")[0]
              .toLowerCase() as LanguageCode;
            if (LANGUAGES_CONFIG.some((item) => item.code === cleanLang)) {
              return cleanLang;
            }
          }
        }
        // Fallback to single standard language property
        if (typeof navigator !== "undefined" && navigator.language) {
          const cleanLang = navigator.language
            .split("-")[0]
            .toLowerCase() as LanguageCode;
          if (LANGUAGES_CONFIG.some((item) => item.code === cleanLang)) {
            return cleanLang;
          }
        }
        return null;
      })();

      if (detectedLang && detectedLang !== language) {
        setLanguage(detectedLang);
      }
    }
  }, [language, setLanguage]);
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const stored = localStorage.getItem(
        "preferred_lang",
      ) as LanguageCode | null;
      if (stored) return stored;
    } catch (e) {
      console.warn("Could not read from localStorage during init:", e);
    }

    if (typeof navigator !== "undefined" && navigator.language) {
      const browserLang = navigator.language.split("-")[0].toLowerCase();
      const isSupported = LANGUAGES_CONFIG.some(
        (lang) => lang.code === browserLang,
      );
      if (isSupported) {
        return browserLang as LanguageCode;
      }
    }

    return "en";
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("preferred_lang", lang);
    } catch (e) {
      console.warn("Could not write to localStorage:", e);
    }
  };

  // Run the browser language detection on load
  useBrowserLanguageDetection(language, setLanguage);

  const isRtl = language === "ar";

  useEffect(() => {
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, isRtl]);

  const t = (key: string): string => {
    // 1. Check in TRANSLATIONS (from translations.ts)
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[key] !== undefined && langDict[key] !== "") {
      return langDict[key];
    }

    // 2. Check in CHARTER_FORM_TRANSLATIONS (from components/charterFormTranslations.ts)
    const charterLang = (
      ["en", "ru", "hi", "zh", "th", "fr", "de"].includes(language)
        ? language
        : "en"
    ) as any;
    const charterDict = CHARTER_FORM_TRANSLATIONS[charterLang];
    if (
      charterDict &&
      charterDict[key] !== undefined &&
      charterDict[key] !== ""
    ) {
      return charterDict[key];
    }

    // 3. Fallbacks to EN for both
    const enDict = TRANSLATIONS["en"];
    if (enDict && enDict[key] !== undefined) {
      return enDict[key];
    }

    const enCharterDict = CHARTER_FORM_TRANSLATIONS["en"];
    if (enCharterDict && enCharterDict[key] !== undefined) {
      return enCharterDict[key];
    }

    return key;
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t, isRtl, languages: LANGUAGES_CONFIG }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
