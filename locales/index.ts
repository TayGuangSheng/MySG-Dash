import en from "./en";
import zh from "./zh";
import ms from "./ms";
import ta from "./ta";

export const dictionaries = {
  en,
  zh,
  ms,
  ta,
} as const;

export type SupportedLanguage = keyof typeof dictionaries;
export type TranslationDictionary = (typeof dictionaries)[SupportedLanguage];

export type NestedKeyOf<T> = T extends Record<string, unknown>
  ? {
      [K in keyof T & string]: T[K] extends string ? K : `${K}.${NestedKeyOf<T[K]>}`;
    }[keyof T & string]
  : never;

export type TranslationKey = NestedKeyOf<TranslationDictionary>;

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  if (!value) return false;
  return (Object.keys(dictionaries) as SupportedLanguage[]).includes(value as SupportedLanguage);
}

export function getLanguageLabel(language: SupportedLanguage, target: SupportedLanguage = language) {
  const dictionary = dictionaries[target];
  const labels = dictionary.common.language;
  switch (language) {
    case "en":
      return labels.english;
    case "zh":
      return labels.chinese;
    case "ms":
      return labels.malay;
    case "ta":
      return labels.tamil;
    default:
      return language;
  }
}

export function resolveLocale(language: SupportedLanguage) {
  switch (language) {
    case "zh":
      return "zh-SG";
    case "ms":
      return "ms-SG";
    case "ta":
      return "ta-SG";
    case "en":
    default:
      return "en-SG";
  }
}

