import type { Chamber, Language } from "../contract/types";

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

const LANGUAGES: readonly string[] = ["es", "ca"];
const CHAMBERS: readonly string[] = ["congreso", "senado"];
const MUNICIPALITY_CODE_PATTERN = /^\d{5}$/;

export function parseRoute(hash: string): Route | null {
  const [language, ...segments] = hash
    .replace(/^#\/?/, "")
    .split("/")
    .filter((segment) => segment !== "");
  if (!LANGUAGES.includes(language)) return null;
  return parseSegments(language as Language, segments);
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
  const base = `#/${route.language}`;
  if (route.page === "home") return base;
  if (route.page === "about") return `${base}/about`;
  const ballot = `${base}/${route.municipalityCode}/${route.chamber}`;
  return route.partySlug ? `${ballot}/${route.partySlug}` : ballot;
}
