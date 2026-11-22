import type { Language } from "../contract/types";
import { DEFAULT_LANGUAGE, isSupportedLanguage } from "./languages";

function isSupported(candidate: string | null): candidate is Language {
  return candidate !== null && isSupportedLanguage(candidate);
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
  return preferred ?? DEFAULT_LANGUAGE;
}
