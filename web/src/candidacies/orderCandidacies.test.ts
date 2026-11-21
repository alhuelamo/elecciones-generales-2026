import { describe, expect, it } from "vitest";
import type { Candidacy } from "../contract/types";
import { buildFixtureCongresoCandidacies } from "../test/fixtures";
import { orderCandidacies } from "./orderCandidacies";

const [first, second, third] = buildFixtureCongresoCandidacies(2);

function named(
  base: Candidacy,
  denomination: string,
  boeOrder: number,
): Candidacy {
  return { ...base, denomination, boeOrder };
}

describe("orderCandidacies", () => {
  it("orders by boeOrder ascending", () => {
    const result = orderCandidacies([third, first, second], "boe", "es");
    expect(result.map((candidacy) => candidacy.slug)).toEqual([
      "pea",
      "peb",
      "coalicion-ejemplo",
    ]);
  });

  it("orders alphabetically ignoring accents and case", () => {
    const input = [
      named(first, "BLOQUE", 1),
      named(second, "ÁGORA", 2),
      named(third, "cuarto", 3),
    ];
    const result = orderCandidacies(input, "alphabetical", "es");
    expect(result.map((candidacy) => candidacy.denomination)).toEqual([
      "ÁGORA",
      "BLOQUE",
      "cuarto",
    ]);
  });

  it("returns a new array without mutating the input", () => {
    const input = [third, first, second];
    const result = orderCandidacies(input, "boe", "es");
    expect(result).not.toBe(input);
    expect(input[0]).toBe(third);
  });

  it("orders by 2023 votes descending with missing results last", () => {
    const result = orderCandidacies([second, third, first], "votes2023", "es");
    expect(result.map((candidacy) => candidacy.slug)).toEqual([
      "pea",
      "coalicion-ejemplo",
      "peb",
    ]);
  });

  it("breaks vote ties by boeOrder", () => {
    const tiedLate = { ...third, boeOrder: 9 };
    const tiedEarly = {
      ...third,
      slug: "early",
      boeOrder: 4,
    };
    const result = orderCandidacies([tiedLate, tiedEarly], "votes2023", "es");
    expect(result.map((candidacy) => candidacy.slug)).toEqual([
      "early",
      "coalicion-ejemplo",
    ]);
  });
});
