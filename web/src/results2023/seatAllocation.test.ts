import { describe, expect, it } from "vitest";
import {
  fixtureCongresoResults2023,
  fixtureSenadoResults2023,
} from "../test/fixtures";
import { seatColors, seatParties, totalSeats } from "./seatAllocation";

describe("seatAllocation", () => {
  it("keeps only parties with seats, by seats then votes descending", () => {
    const [pea, peb, cec] = fixtureCongresoResults2023.parties;
    const shuffled = {
      ...fixtureCongresoResults2023,
      parties: [cec, pea, peb],
    };
    expect(seatParties(shuffled).map(({ acronym }) => acronym)).toEqual([
      "PEA",
      "PEB",
      "CEC-D",
    ]);
  });

  it("keeps input order when votes are null", () => {
    const parties = fixtureSenadoResults2023.parties;
    const reversed = {
      ...fixtureSenadoResults2023,
      parties: [...parties].reverse(),
    };
    expect(seatParties(reversed).map(({ acronym }) => acronym)).toEqual([
      "PEA",
      "PEB",
    ]);
    const equalSeats = {
      ...fixtureSenadoResults2023,
      parties: parties.map((party) => ({ ...party, seats: 1 })).reverse(),
    };
    expect(seatParties(equalSeats).map(({ acronym }) => acronym)).toEqual([
      "PEB",
      "PEA",
    ]);
  });

  it("expands to one colour per seat", () => {
    const results = fixtureCongresoResults2023;
    const colors = seatColors(seatParties(results));
    expect(colors).toEqual([
      "#d6402b",
      "#d6402b",
      "#d6402b",
      "#d6402b",
      "#1d84ce",
      "#1d84ce",
      null,
      null,
    ]);
    expect(colors).toHaveLength(totalSeats(results));
  });

  it("totals seats over parties", () => {
    expect(totalSeats(fixtureCongresoResults2023)).toBe(8);
  });
});
