import { describe, expect, it } from "vitest";
import {
  fixtureCongresoResults2023,
  fixtureSenadoResults2023,
} from "../test/fixtures";
import { seatParties } from "./seatAllocation";

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
});
