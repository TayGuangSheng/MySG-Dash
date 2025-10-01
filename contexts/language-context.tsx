"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_LANGUAGE,
  dictionaries,
  getLanguageLabel,
  isSupportedLanguage,
  resolveLocale,
  type SupportedLanguage,
  type TranslationDictionary,
  type TranslationKey,
} from "@/locales";

type ReplacementValues = Record<string, string | number | boolean>;

export type Translator = (key: TranslationKey, replacements?: ReplacementValues) => string;

type LanguageContextValue = {
  language: SupportedLanguage;
  locale: string;
  setLanguage: (language: SupportedLanguage) => void;
  t: Translator;
  availableLanguages: Array<{ code: SupportedLanguage; label: string }>;
  ready: boolean;
};

const STORAGE_KEY = "sgdash.language";

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isSupportedLanguage(stored)) {
      setLanguageState(stored);
    } else {
      const browserLanguage = window.navigator.language.toLowerCase();
      if (browserLanguage.startsWith("zh")) {
      setLanguageState("zh");
    } else if (browserLanguage.startsWith("ms")) {
      setLanguageState("ms");
    } else if (browserLanguage.startsWith("ta")) {
      setLanguageState("ta");
    }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const locale = useMemo(() => resolveLocale(language), [language]);

  const translate = useCallback<Translator>(
    (key, replacements) => resolveTranslation(dictionaries[language], key, replacements),
    [language],
  );

  const setLanguage = useCallback((next: SupportedLanguage) => {
    setLanguageState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const availableLanguages = useMemo(
    () =>
      (Object.keys(dictionaries) as SupportedLanguage[]).map((code) => ({
        code,
        label: getLanguageLabel(code, language),
      })),
    [language],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      locale,
      setLanguage,
      t: translate,
      availableLanguages,
      ready,
    }),
    [language, locale, setLanguage, translate, availableLanguages, ready],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguageContext must be used within a LanguageProvider");
  }
  return context;
}

export function useTranslation() {
  const { t, language, locale, setLanguage, availableLanguages, ready } = useLanguageContext();
  return { t, language, locale, setLanguage, availableLanguages, ready };
}

function resolveTranslation(
  dictionary: TranslationDictionary,
  key: TranslationKey,
  replacements?: ReplacementValues,
) {
  const segments = key.split(".");
  let current: unknown = dictionary;

  for (const segment of segments) {
    if (typeof current !== "object" || current === null || !(segment in current)) {
      return key;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  if (typeof current !== "string") {
    return key;
  }

  if (!replacements) {
    return current;
  }

  return current.replace(/\{\{(.*?)\}\}/g, (match, token) => {
    const value = replacements[token.trim()];
    if (value === undefined || value === null) {
      return match;
    }
    return String(value);
  });
}

