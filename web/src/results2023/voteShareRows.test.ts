import { describe, expect, it } from "vitest";
import { fixtureCongresoResults2023 } from "../test/fixtures";
import { voteShareRows } from "./voteShareRows";

describe("voteShareRows", () => {
  it("lists parties, then others, then blank", () => {
    expect(voteShareRows(fixtureCongresoResults2023)).toEqual([
      {
        kind: "party",
        acronym: "PEA",
        name: "PARTIDO EJEMPLO A",
        percentage: 40,
        color: "#d6402b",
      },
      {
        kind: "party",
        acronym: "PEB",
        name: "PARTIDO EJEMPLO B",
        percentage: 30,
        color: "#1d84ce",
      },
      {
        kind: "party",
        acronym: "CEC-D",
        name: "COALICION EJEMPLO CD",
        percentage: 20,
        color: null,
      },
      { kind: "others", percentage: 1 },
      { kind: "blank", percentage: 9 },
    ]);
  });

  it("groups parties under 1 percent with a rounded sum over valid votes", () => {
    const rows = voteShareRows({
      ...fixtureCongresoResults2023,
      validVotes: 3000,
      parties: [
        {
          ...fixtureCongresoResults2023.parties[0],
          votes: 2900,
          percentage: 96.67,
        },
        {
          ...fixtureCongresoResults2023.parties[3],
          votes: 10,
          percentage: 0.33,
        },
        {
          ...fixtureCongresoResults2023.parties[4],
          votes: 20,
          percentage: 0.67,
        },
      ],
    });
    expect(rows.find(({ kind }) => kind === "others")).toEqual({
      kind: "others",
      percentage: 1,
    });
  });

  it("omits others when every party reaches 1 percent", () => {
    const rows = voteShareRows({
      ...fixtureCongresoResults2023,
      parties: fixtureCongresoResults2023.parties.slice(0, 3),
    });
    expect(rows.map(({ kind }) => kind)).toEqual([
      "party",
      "party",
      "party",
      "blank",
    ]);
  });

  it("keeps a party at exactly 1 percent as a party row", () => {
    const rows = voteShareRows({
      ...fixtureCongresoResults2023,
      parties: [
        {
          ...fixtureCongresoResults2023.parties[0],
          votes: 10000,
          percentage: 1,
        },
      ],
    });
    expect(rows[0].kind).toBe("party");
    expect(rows.map(({ kind }) => kind)).not.toContain("others");
  });

  it("sorts party rows by votes descending", () => {
    const [first, second] = fixtureCongresoResults2023.parties;
    const rows = voteShareRows({
      ...fixtureCongresoResults2023,
      parties: [second, first],
    });
    expect(
      rows.slice(0, 2).map((row) => "acronym" in row && row.acronym),
    ).toEqual(["PEA", "PEB"]);
  });
});
