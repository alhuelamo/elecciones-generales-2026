import type { Language, LocalizedText } from "../contract/types";

export function localizedName(text: LocalizedText, language: Language): string {
  return text[language] ?? text.es;
}
