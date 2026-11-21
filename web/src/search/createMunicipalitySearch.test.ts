import { describe, expect, it } from "vitest";
import { fixtureIndex } from "../test/fixtures";
import {
  MAX_RESULTS,
  createMunicipalitySearch,
} from "./createMunicipalitySearch";

const search = createMunicipalitySearch(fixtureIndex.municipalities);

describe("createMunicipalitySearch", () => {
  it.each([
    ["a coruna", "15030"],
    ["coruña", "15030"],
    ["lhospitalet", "08101"],
    ["l'hospitalet", "08101"],
    ["hospitalet", "08101"],
    ["alacant", "03014"],
    ["alicante", "03014"],
    ["donostia", "20069"],
    ["san sebastian", "20069"],
    ["madrid", "28079"],
    ["barclona", "08019"],
  ])("%s -> %s first", (query, code) =>
    expect(search(query)[0]?.code).toBe(code),
  );

  it("lists homonyms", () =>
    expect(
      search("mieres")
        .map((municipality) => municipality.code)
        .sort(),
    ).toEqual(["17105", "33037"]));

  it("ranks exact name before containing names", () => {
    const codes = search("madrid").map((municipality) => municipality.code);
    expect(codes.indexOf("28079")).toBeLessThan(codes.indexOf("28127"));
  });

  it("empty query yields nothing", () => expect(search("   ")).toEqual([]));

  it("caps results", () =>
    expect(search("a").length).toBeLessThanOrEqual(MAX_RESULTS));

  it("does not repeat municipalities", () => {
    const codes = search("alicante").map((municipality) => municipality.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
