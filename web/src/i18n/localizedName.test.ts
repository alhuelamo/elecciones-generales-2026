import { describe, expect, it } from "vitest";
import type { Language, LocalizedText } from "../contract/types";
import { localizedName } from "./localizedName";

const SAN_SEBASTIAN: LocalizedText = {
  es: "San Sebastián",
  ca: "Donostia",
  eu: "Donostia",
};

describe("localizedName", () => {
  it.each([
    ["es", "San Sebastián"],
    ["ca", "Donostia"],
    ["eu", "Donostia"],
    ["gl", "San Sebastián"],
  ])("%s -> %s", (language, expected) =>
    expect(localizedName(SAN_SEBASTIAN, language as Language)).toBe(expected),
  );
});
