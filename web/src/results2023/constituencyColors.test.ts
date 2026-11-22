/// <reference types="node" />
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "../design/contrast";
import {
  MINIMUM_COLOR_DISTANCE,
  SHIFTED_LIGHTNESS_VALUES,
  resolveDistinctColors,
} from "./constituencyColors";
import {
  FALLBACK_PARTY_COLOR,
  PAPER_COLORS,
  colorDistance,
  harmonizePartyColor,
  harmonizePartyColorAtLightness,
} from "./partyColor";

const publishedColors = [
  ...readFileSync("../pipeline/data/party_colors.yaml", "utf8").matchAll(
    /color: "(#[0-9a-fA-F]{6})"/g,
  ),
].map((match) => match[1]);

const ERC = { acronym: "ERC", color: "#ffb232" };
const CUP = { acronym: "CUP-PR", color: "#f2cc00" };

describe("resolveDistinctColors", () => {
  it("keeps the canonical colour of the bigger party", () => {
    const colors = resolveDistinctColors([ERC, CUP]);
    expect(colors.ERC).toBe(harmonizePartyColor(ERC.color));
  });

  it("separates similar colours of different parties", () => {
    const colors = resolveDistinctColors([ERC, CUP]);
    expect(
      colorDistance(
        harmonizePartyColor(ERC.color),
        harmonizePartyColor(CUP.color),
      ),
    ).toBeLessThan(MINIMUM_COLOR_DISTANCE);
    expect(colorDistance(colors.ERC, colors["CUP-PR"])).toBeGreaterThanOrEqual(
      MINIMUM_COLOR_DISTANCE,
    );
  });

  it("gives the first party the canonical colour regardless of name", () => {
    const colors = resolveDistinctColors([CUP, ERC]);
    expect(colors["CUP-PR"]).toBe(harmonizePartyColor(CUP.color));
    expect(colors.ERC).not.toBe(colors["CUP-PR"]);
  });

  it("leaves the main Madrid parties unchanged", () => {
    const madrid = [
      { acronym: "PP", color: "#1e4b8f" },
      { acronym: "PSOE", color: "#ff0000" },
      { acronym: "VOX", color: "#63be21" },
      { acronym: "SUMAR", color: "#ef4b91" },
    ];
    const colors = resolveDistinctColors(madrid);
    madrid.forEach(({ acronym, color }) => {
      expect(colors[acronym]).toBe(harmonizePartyColor(color));
    });
  });

  it("ignores grey fallbacks when comparing", () => {
    const colors = resolveDistinctColors([
      { acronym: "A", color: null },
      { acronym: "B", color: null },
      { acronym: "C", color: "#f0f0f0" },
      { acronym: "D", color: "#f0f0f0" },
    ]);
    expect(colors.A).toBe(FALLBACK_PARTY_COLOR);
    expect(colors.B).toBe(FALLBACK_PARTY_COLOR);
    expect(colors.C).toBe(colors.D);
  });

  it("keeps shifted lightness at least 2:1 against both papers", () => {
    publishedColors.forEach((hex) => {
      SHIFTED_LIGHTNESS_VALUES.forEach((lightness) => {
        const shifted = harmonizePartyColorAtLightness(hex, lightness);
        Object.values(PAPER_COLORS).forEach((paper) => {
          expect(contrastRatio(shifted, paper)).toBeGreaterThanOrEqual(2);
        });
      });
    });
  });
});
