import { describe, expect, it } from "vitest";
import { detectLanguage } from "./detectLanguage";

describe("detectLanguage", () => {
  it.each([
    [null, ["ca-ES"], "ca"],
    [null, ["ca-ES-valencia"], "ca"],
    [null, ["es-ES"], "es"],
    [null, ["en-GB", "ca"], "ca"],
    [null, ["gl-ES"], "es"],
    ["ca", ["es-ES"], "ca"],
    ["xx", ["ca"], "ca"],
  ])("stored %s + navigator %j -> %s", (stored, languages, expected) => {
    expect(detectLanguage(stored, languages)).toBe(expected);
  });
});
