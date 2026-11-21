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
    ["#/es/8019", { page: "home", language: "es" }],
  ])("parses %s", (hash, route) => expect(parseRoute(hash)).toEqual(route));

  it.each(["", "#", "#/en/08019", "#/"])("rejects %s", (hash) =>
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

  it("round-trips", () => {
    const hash = "#/ca/07040/senado/pp";
    expect(buildHash(parseRoute(hash)!)).toBe(hash);
  });
});
