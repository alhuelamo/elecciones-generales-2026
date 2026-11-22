import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync("index.html", "utf8");

describe("index.html icons", () => {
  it.each([
    ['rel="icon" href="/favicon.ico" sizes="any"', "favicon.ico"],
    ['rel="icon" type="image/svg+xml" href="/favicon.svg"', "favicon.svg"],
    [
      'rel="apple-touch-icon" href="/apple-touch-icon.png"',
      "apple-touch-icon.png",
    ],
  ])("links %s", (link, file) => {
    expect(html).toContain(link);
    expect(existsSync(`public/${file}`)).toBe(true);
  });
});
