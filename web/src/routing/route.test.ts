import { describe, expect, it } from "vitest";
import type { Chamber, Language } from "../contract/types";
import { buildHash, languageFromHash, parseRoute, type Route } from "./route";

describe("parseRoute", () => {
  it.each([
    [
      "#/08019/senado/psc-psoe",
      "ca",
      ballot("ca", "08019", "senado", "psc-psoe"),
    ],
    ["#/08019", "es", ballot("es", "08019", "congreso", null)],
    ["#/08019/cortes", "es", ballot("es", "08019", "congreso", null)],
    ["#/15030/senado/pp", "gl", ballot("gl", "15030", "senado", "pp")],
    ["#/about", "es", { page: "about", language: "es" }],
    ["#/", "ca", { page: "home", language: "ca" }],
    ["", "eu", { page: "home", language: "eu" }],
    ["#/8019", "es", { page: "home", language: "es" }],
  ])("parses canonical %s in %s", (hash, language, route) =>
    expect(parseRoute(hash, language as Language)).toEqual(route),
  );

  it.each([
    ["#/eu/20069/congreso/pp", "es", ballot("eu", "20069", "congreso", "pp")],
    ["#/ca", "es", { page: "home", language: "ca" }],
    ["#/ca/", null, { page: "home", language: "ca" }],
    ["#/gl/about", "eu", { page: "about", language: "gl" }],
    ["#/es/08019", null, ballot("es", "08019", "congreso", null)],
  ])("migrates legacy %s (path %s)", (hash, pathLanguage, route) =>
    expect(parseRoute(hash, pathLanguage as Language | null)).toEqual(route),
  );

  it.each(["", "#", "#/", "#/08019/congreso", "#/about"])(
    "rejects %s without any language",
    (hash) => expect(parseRoute(hash, null)).toBeNull(),
  );
});

describe("languageFromHash", () => {
  it.each([
    ["#/eu/20069", "eu"],
    ["#/ca", "ca"],
    ["#/20069/congreso", null],
    ["#/about", null],
    ["#/en", null],
    ["", null],
  ])("reads %s", (hash, language) =>
    expect(languageFromHash(hash)).toBe(language),
  );
});

describe("buildHash", () => {
  it("builds canonical ballot hash without language", () =>
    expect(buildHash(ballot("es", "08019", "congreso", null))).toBe(
      "#/08019/congreso",
    ));

  it("builds party ballot hash", () =>
    expect(buildHash(ballot("eu", "20069", "senado", "pp"))).toBe(
      "#/20069/senado/pp",
    ));

  it("builds home and about hashes", () => {
    expect(buildHash({ page: "home", language: "ca" })).toBe("#/");
    expect(buildHash({ page: "about", language: "es" })).toBe("#/about");
  });

  it.each([
    "#/07040/senado/pp",
    "#/20069/congreso",
    "#/15030/senado/pp",
    "#/about",
    "#/",
  ])("round-trips %s", (hash) => {
    expect(buildHash(parseRoute(hash, "gl")!)).toBe(hash);
  });
});

function ballot(
  language: Language,
  municipalityCode: string,
  chamber: Chamber,
  partySlug: string | null,
): Route {
  return { page: "ballot", language, municipalityCode, chamber, partySlug };
}
