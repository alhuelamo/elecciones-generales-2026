import { describe, expect, it } from "vitest";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_NATIVE_NAMES,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
} from "./languages";

describe("isSupportedLanguage", () => {
  it.each([
    ["es", true],
    ["ca", true],
    ["eu", true],
    ["gl", true],
    ["en", false],
    ["EU", false],
    ["", false],
  ])("%s -> %s", (value, expected) =>
    expect(isSupportedLanguage(value)).toBe(expected),
  );
});

describe("languages", () => {
  it("defaults to es", () => expect(DEFAULT_LANGUAGE).toBe("es"));

  it.each([
    ["es", "Castellano"],
    ["ca", "Català"],
    ["eu", "Euskara"],
    ["gl", "Galego"],
  ])("native name of %s is %s", (language, expected) =>
    expect(
      LANGUAGE_NATIVE_NAMES[language as (typeof SUPPORTED_LANGUAGES)[number]],
    ).toBe(expected),
  );

  it("has one native name per supported language", () =>
    expect(Object.keys(LANGUAGE_NATIVE_NAMES)).toEqual([
      ...SUPPORTED_LANGUAGES,
    ]));
});
