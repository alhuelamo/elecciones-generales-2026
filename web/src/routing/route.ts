import type { Chamber, Language } from "../contract/types";
import { isSupportedLanguage } from "../i18n/languages";

export type Route =
  | { page: "home"; language: Language }
  | { page: "about"; language: Language }
  | {
      page: "ballot";
      language: Language;
      municipalityCode: string;
      chamber: Chamber;
      partySlug: string | null;
    };

const CHAMBERS: readonly string[] = ["congreso", "senado"];
const MUNICIPALITY_CODE_PATTERN = /^\d{5}$/;

function hashSegments(hash: string): string[] {
  return hash
    .replace(/^#\/?/, "")
    .split("/")
    .filter((segment) => segment !== "");
}

export function languageFromHash(hash: string): Language | null {
  const [first] = hashSegments(hash);
  return isSupportedLanguage(first) ? first : null;
}

export function parseRoute(hash: string, pathLanguage: Language | null) {
  const language = languageFromHash(hash) ?? pathLanguage;
  if (language === null) return null;
  const segments = hashSegments(hash);
  const withoutLegacyLanguage = languageFromHash(hash)
    ? segments.slice(1)
    : segments;
  return parseSegments(language, withoutLegacyLanguage);
}

function parseSegments(language: Language, segments: string[]): Route {
  const [first, chamber, partySlug] = segments;
  if (first === "about") return { page: "about", language };
  if (first === undefined || !MUNICIPALITY_CODE_PATTERN.test(first)) {
    return { page: "home", language };
  }
  const isKnownChamber = CHAMBERS.includes(chamber);
  return {
    page: "ballot",
    language,
    municipalityCode: first,
    chamber: isKnownChamber ? (chamber as Chamber) : "congreso",
    partySlug: isKnownChamber ? (partySlug ?? null) : null,
  };
}

export function buildHash(route: Route): string {
  if (route.page === "home") return "#/";
  if (route.page === "about") return "#/about";
  const ballot = `#/${route.municipalityCode}/${route.chamber}`;
  return route.partySlug ? `${ballot}/${route.partySlug}` : ballot;
}
