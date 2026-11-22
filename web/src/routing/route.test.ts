import { describe, expect, it } from "vitest";
import { buildHash, parseRoute } from "./route";

describe("parseRoute", () => {
  it.each([
    [
      "#/ca/08019/senado/psc-psoe",
      {
        page: "ballot",
        language: "ca",
        municipalityCode: "08019",
        chamber: "senado",
        partySlug: "psc-psoe",
      },
    ],
    [
      "#/es/08019",
      {
        page: "ballot",
        language: "es",
        municipalityCode: "08019",
        chamber: "congreso",
        partySlug: null,
      },
    ],
    [
      "#/es/08019/cortes",
      {
        page: "ballot",
        language: "es",
        municipalityCode: "08019",
        chamber: "congreso",
        partySlug: null,
      },
    ],
    ["#/es/about", { page: "about", language: "es" }],
    ["#/ca", { page: "home", language: "ca" }],
    ["#/ca/", { page: "home", language: "ca" }],
    ["#/eu", { page: "home", language: "eu" }],
    ["#/gl/about", { page: "about", language: "gl" }],
    ["#/eu/about", { page: "about", language: "eu" }],
    [
      "#/gl/15030/senado/pp",
      {
        page: "ballot",
        language: "gl",
        municipalityCode: "15030",
        chamber: "senado",
        partySlug: "pp",
      },
    ],
    ["#/es/8019", { page: "home", language: "es" }],
  ])("parses %s", (hash, route) => expect(parseRoute(hash)).toEqual(route));

  it.each(["", "#", "#/en/08019", "#/", "#/en"])("rejects %s", (hash) =>
    expect(parseRoute(hash)).toBeNull(),
  );
});

describe("buildHash", () => {
  it("builds canonical ballot hash", () =>
    expect(
      buildHash({
        page: "ballot",
        language: "es",
        municipalityCode: "08019",
        chamber: "congreso",
        partySlug: null,
      }),
    ).toBe("#/es/08019/congreso"));

  it("builds home and about hashes", () => {
    expect(buildHash({ page: "home", language: "ca" })).toBe("#/ca");
    expect(buildHash({ page: "about", language: "es" })).toBe("#/es/about");
  });

  it.each([
    "#/ca/07040/senado/pp",
    "#/eu/20069/congreso",
    "#/gl/15030/senado/pp",
    "#/eu/about",
    "#/gl",
  ])("round-trips %s", (hash) => {
    expect(buildHash(parseRoute(hash)!)).toBe(hash);
  });
});
