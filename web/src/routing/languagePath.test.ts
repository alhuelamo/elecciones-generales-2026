import { describe, expect, it } from "vitest";
import { entryPathname, languageFromPathname } from "./languagePath";

const BASE = "/elecciones-generales-2026/";

describe("languageFromPathname", () => {
  it.each([
    ["/elecciones-generales-2026/eu/", "eu"],
    ["/elecciones-generales-2026/gl", "gl"],
    ["/elecciones-generales-2026/ca/index.html", "ca"],
  ])("reads the language from %s", (pathname, language) => {
    expect(languageFromPathname(pathname, BASE)).toBe(language);
  });

  it.each([
    "/elecciones-generales-2026/",
    "/elecciones-generales-2026/fr/",
    "/elecciones-generales-2026/eu/extra/",
    "/other/eu/",
    "/",
  ])("returns null for %s", (pathname) => {
    expect(languageFromPathname(pathname, BASE)).toBeNull();
  });
});

describe("entryPathname", () => {
  it("builds the per-language entry path", () => {
    expect(entryPathname("eu", BASE)).toBe("/elecciones-generales-2026/eu/");
  });
});
