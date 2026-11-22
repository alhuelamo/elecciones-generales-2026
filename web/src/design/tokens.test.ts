/// <reference types="node" />
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { contrastRatio } from "./contrast";

const css = readFileSync("src/index.css", "utf8");

function extractBlock(startMarker: string): string {
  const start = css.indexOf(startMarker);
  const end = css.indexOf("}", start);
  return css.slice(start, end);
}

function parseColors(block: string): Record<string, string> {
  const colors: Record<string, string> = {};
  for (const match of block.matchAll(
    /--color-([\w-]+):\s*(#[0-9a-fA-F]{6});/g,
  )) {
    colors[match[1]] = match[2];
  }
  return colors;
}

const lightColors = parseColors(extractBlock("@theme"));
const darkColors = { ...lightColors, ...parseColors(extractBlock(".dark {")) };
const MODES = { light: lightColors, dark: darkColors };

const PAIRS = [
  ["ink", "paper"],
  ["ink-muted", "paper"],
  ["ink", "paper-raised"],
  ["accent", "paper"],
  ["accent", "paper-raised"],
  ["ink", "kraft"],
  ["accent", "kraft"],
  ["ink-muted", "kraft"],
] as const;

describe("design tokens", () => {
  it("keeps a themed scrollbar track instead of an empty gutter", () => {
    const html = extractBlock("html {");
    expect(html).toContain("overflow-y: scroll;");
    expect(html).toContain(
      "scrollbar-color: var(--color-rule-strong) var(--color-paper);",
    );
    expect(css).not.toContain("scrollbar-gutter");
  });

  it("paints the paper texture on the root so it also covers the scrollbar gutter", () => {
    expect(extractBlock("html {")).toContain(
      "background-image: var(--paper-texture);",
    );
    expect(css).not.toContain("body::before");
  });

  it.each([
    ["html {", "light"],
    [".dark {", "dark"],
  ])("tells the browser %s renders native UI in %s", (selector, scheme) => {
    expect(extractBlock(selector)).toContain(`color-scheme: ${scheme};`);
  });

  describe.each(Object.entries(MODES))("%s mode", (_mode, colors) => {
    it.each(PAIRS)("%s on %s reaches AA", (foreground, background) => {
      expect(
        contrastRatio(colors[foreground], colors[background]),
      ).toBeGreaterThanOrEqual(4.5);
    });

    it("keeps the focus ring visible on paper", () => {
      expect(contrastRatio(colors.accent, colors.paper)).toBeGreaterThanOrEqual(
        3,
      );
    });
  });
});
