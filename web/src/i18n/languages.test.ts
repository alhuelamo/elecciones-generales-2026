import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_NATIVE_NAMES,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  numberFormatLocale,
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

describe("numberFormatLocale", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns the language when the runtime has locale data for it", () => {
    vi.spyOn(Intl.NumberFormat, "supportedLocalesOf").mockReturnValue(["eu"]);
    expect(numberFormatLocale("eu")).toBe("eu");
  });

  it("falls back to the default language when the runtime lacks locale data", () => {
    vi.spyOn(Intl.NumberFormat, "supportedLocalesOf").mockReturnValue([]);
    expect(numberFormatLocale("eu")).toBe(DEFAULT_LANGUAGE);
  });
});
