export const SUPPORTED_LANGUAGES = ["es", "ca", "eu", "gl"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "es";

export const LANGUAGE_NATIVE_NAMES: Record<Language, string> = {
  es: "Castellano",
  ca: "Català",
  eu: "Euskara",
  gl: "Galego",
};

export function isSupportedLanguage(value: string): value is Language {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function numberFormatLocale(language: Language): string {
  return Intl.NumberFormat.supportedLocalesOf([language]).includes(language)
    ? language
    : DEFAULT_LANGUAGE;
}
