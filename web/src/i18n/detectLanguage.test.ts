import { describe, expect, it } from "vitest";
import { detectLanguage } from "./detectLanguage";

describe("detectLanguage", () => {
  it.each([
    [null, ["ca-ES"], "ca"],
    [null, ["ca-ES-valencia"], "ca"],
    [null, ["es-ES"], "es"],
    [null, ["en-GB", "ca"], "ca"],
    [null, ["gl-ES"], "gl"],
    [null, ["eu-ES"], "eu"],
    [null, ["eu"], "eu"],
    ["gl", ["es-ES"], "gl"],
    [null, ["en-GB", "gl-ES"], "gl"],
    ["ca", ["es-ES"], "ca"],
    ["xx", ["ca"], "ca"],
  ])("stored %s + navigator %j -> %s", (stored, languages, expected) => {
    expect(detectLanguage(stored, languages)).toBe(expected);
  });
});
