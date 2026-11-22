/// <reference types="node" />
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  FALLBACK_PARTY_COLOR,
  PAPER_COLORS,
  needsOutline,
  partyColor,
} from "./partyColor";

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

  it("keeps a given colour", () => {
    expect(partyColor("#1d84ce")).toBe("#1d84ce");
  });

  it("outlines colours that vanish against either paper", () => {
    expect(needsOutline("#ffffff")).toBe(true);
    expect(needsOutline("#000000")).toBe(true);
  });

  it("does not outline the fallback grey", () => {
    expect(needsOutline(FALLBACK_PARTY_COLOR)).toBe(false);
  });

  it("matches the paper tokens in index.css", () => {
    expect(PAPER_COLORS.light).toBe(paperIn("@theme"));
    expect(PAPER_COLORS.dark).toBe(paperIn(".dark {"));
  });
});
