import type { Language } from "../contract/types";

const SUPPORTED_LANGUAGES: readonly Language[] = ["es", "ca"];

function isSupported(candidate: string | null): candidate is Language {
  return SUPPORTED_LANGUAGES.includes(candidate as Language);
}

function primarySubtag(languageTag: string): string {
  return languageTag.toLowerCase().split("-")[0];
}

export function detectLanguage(
  stored: string | null,
  navigatorLanguages: readonly string[],
): Language {
  if (isSupported(stored)) {
    return stored;
  }
  const preferred = navigatorLanguages.map(primarySubtag).find(isSupported);
  return preferred ?? "es";
}
