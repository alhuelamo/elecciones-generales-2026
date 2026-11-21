import Fuse from "fuse.js";
import type { Municipality } from "../contract/types";
import { normalizeForSearch } from "./normalizeForSearch";

export const MAX_RESULTS = 10;

interface SearchEntry {
  municipality: Municipality;
  normalizedName: string;
  normalizedAliases: string[];
}

function toEntry(municipality: Municipality): SearchEntry {
  return {
    municipality,
    normalizedName: normalizeForSearch(municipality.name),
    normalizedAliases: municipality.aliases.map(normalizeForSearch),
  };
}

function compact(text: string): string {
  return text.replace(/ /g, "");
}

function forms(entry: SearchEntry): string[] {
  return [entry.normalizedName, ...entry.normalizedAliases];
}

function isExactMatch(entry: SearchEntry, query: string): boolean {
  return forms(entry).some(
    (form) => form === query || compact(form) === compact(query),
  );
}

function isPrefixMatch(entry: SearchEntry, query: string): boolean {
  return forms(entry).some(
    (form) =>
      form.startsWith(query) || compact(form).startsWith(compact(query)),
  );
}

function uniqueByCode(municipalities: Municipality[]): Municipality[] {
  const seen = new Set<string>();
  return municipalities.filter(({ code }) => {
    if (seen.has(code)) return false;
    seen.add(code);
    return true;
  });
}

export function createMunicipalitySearch(
  municipalities: Municipality[],
): (query: string) => Municipality[] {
  const entries = municipalities.map(toEntry);
  const fuse = new Fuse(entries, {
    threshold: 0.35,
    ignoreLocation: true,
    includeScore: true,
    keys: [
      { name: "normalizedName", weight: 2 },
      { name: "normalizedAliases", weight: 1 },
    ],
  });

  return (rawQuery) => {
    const query = normalizeForSearch(rawQuery);
    if (!query) return [];
    const exact = entries.filter((entry) => isExactMatch(entry, query));
    const prefix = entries.filter(
      (entry) => !exact.includes(entry) && isPrefixMatch(entry, query),
    );
    const fuzzy = fuse.search(query).map((result) => result.item);
    return uniqueByCode(
      [...exact, ...prefix, ...fuzzy].map((entry) => entry.municipality),
    ).slice(0, MAX_RESULTS);
  };
}
