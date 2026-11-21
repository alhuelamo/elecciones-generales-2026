import { describe, expect, it } from "vitest";
import { normalizeForSearch } from "./normalizeForSearch";

describe("normalizeForSearch", () => {
  it.each([
    ["L'Hospitalet", "l hospitalet"],
    ["Alacant/Alicante", "alacant alicante"],
    ["Coruña, A", "coruna a"],
    ["Col·legi", "collegi"],
    ["  Sant  Martí ", "sant marti"],
  ])("normalizes %s", (raw, expected) =>
    expect(normalizeForSearch(raw)).toBe(expected),
  );
});
