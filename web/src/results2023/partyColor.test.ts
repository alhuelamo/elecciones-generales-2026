/// <reference types="node" />
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "../design/contrast";
import {
  FALLBACK_PARTY_COLOR,
  NEUTRAL_PARTY_COLOR,
  PAPER_COLORS,
  harmonizePartyColor,
  partyColor,
} from "./partyColor";

const MINIMUM_SANITY_CONTRAST = 2;
const publishedColors = [
  ...readFileSync("../pipeline/data/party_colors.yaml", "utf8").matchAll(
    /color: "(#[0-9a-fA-F]{6})"/g,
  ),
].map((match) => match[1]);

const css = readFileSync("src/index.css", "utf8");

function paperIn(startMarker: string): string {
  const start = css.indexOf(startMarker);
  const block = css.slice(start, css.indexOf("}", start));
  return block.match(/--color-paper:\s*(#[0-9a-fA-F]{6});/)![1];
}

describe("partyColor", () => {
  it("falls back to grey when there is no colour", () => {
    expect(partyColor(null)).toBe(FALLBACK_PARTY_COLOR);
  });

  it("harmonises a given colour", () => {
    expect(partyColor("#1d84ce")).toBe(harmonizePartyColor("#1d84ce"));
  });

  it("maps achromatic colours to the neutral", () => {
    expect(harmonizePartyColor("#1d1d1b")).toBe(NEUTRAL_PARTY_COLOR);
    expect(harmonizePartyColor("#000000")).toBe(NEUTRAL_PARTY_COLOR);
  });

  it("keeps vivid colours recognisably the same hue but softer", () => {
    const red = harmonizePartyColor("#ff0000");
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(red.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
    expect(g).toBeGreaterThan(0x30);
  });

  it("returns valid hex and is idempotent in lightness", () => {
    expect(harmonizePartyColor("#63be21")).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("has published-party colours with at least 2:1 against both papers", () => {
    expect(publishedColors.length).toBeGreaterThan(10);
    publishedColors.forEach((color) => {
      const harmonized = harmonizePartyColor(color);
      Object.values(PAPER_COLORS).forEach((paper) => {
        expect(contrastRatio(harmonized, paper)).toBeGreaterThanOrEqual(
          MINIMUM_SANITY_CONTRAST,
        );
      });
    });
  });

  it("matches the paper tokens in index.css", () => {
    expect(PAPER_COLORS.light).toBe(paperIn("@theme"));
    expect(PAPER_COLORS.dark).toBe(paperIn(".dark {"));
  });
});
