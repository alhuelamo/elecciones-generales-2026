import type { Language } from "../contract/types";
import { isSupportedLanguage } from "../i18n/languages";

const BASE_PATH = import.meta.env.BASE_URL;
const ENTRY_FILE = "index.html";

export function languageFromPathname(
  pathname: string,
  basePath: string = BASE_PATH,
): Language | null {
  if (!pathname.startsWith(basePath)) return null;
  const [language, ...rest] = pathname
    .slice(basePath.length)
    .split("/")
    .filter((segment) => segment !== "");
  const isEntryPath = rest.length === 0 || rest.join("/") === ENTRY_FILE;
  return isEntryPath && language && isSupportedLanguage(language)
    ? language
    : null;
}

export function entryPathname(
  language: Language,
  basePath: string = BASE_PATH,
): string {
  return `${basePath}${language}/`;
}
