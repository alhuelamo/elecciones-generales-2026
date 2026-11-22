import { contrastRatio } from "../design/contrast";

export const FALLBACK_PARTY_COLOR = "#8c877c";
export const PAPER_COLORS = { light: "#faf7f0", dark: "#16151a" } as const;
export const MINIMUM_NON_TEXT_CONTRAST = 3;

export function partyColor(color: string | null): string {
  return color ?? FALLBACK_PARTY_COLOR;
}

export function needsOutline(colorHex: string): boolean {
  return Object.values(PAPER_COLORS).some(
    (paper) => contrastRatio(colorHex, paper) < MINIMUM_NON_TEXT_CONTRAST,
  );
}
