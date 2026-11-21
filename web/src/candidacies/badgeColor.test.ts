import { describe, expect, it } from "vitest";
import { badgeColor, contrastRatio } from "./badgeColor";

const SAMPLE_ACRONYMS = Array.from({ length: 50 }, (_, index) =>
  index % 2 ? `PAR${index * 7}` : `Sigla-${index * 13}`,
);

describe("badgeColor", () => {
  it("is deterministic and case-insensitive", () => {
    expect(badgeColor("PP")).toEqual(badgeColor("PP"));
    expect(badgeColor("PP")).toEqual(badgeColor("pp"));
  });

  it("gives different colours to different acronyms", () => {
    expect(badgeColor("PP").background).not.toBe(badgeColor("PSOE").background);
  });

  it.each(SAMPLE_ACRONYMS)("keeps readable contrast for %s", (acronym) => {
    const { background, foreground } = badgeColor(acronym);
    expect(background).toMatch(/^#[0-9a-f]{6}$/);
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});
