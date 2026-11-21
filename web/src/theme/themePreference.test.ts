import { beforeEach, describe, expect, it } from "vitest";
import {
  applyTheme,
  loadThemePreference,
  nextThemePreference,
  resolveTheme,
  saveThemePreference,
} from "./themePreference";

describe("resolveTheme", () => {
  it.each([
    ["system", true, "dark"],
    ["system", false, "light"],
    ["light", true, "light"],
    ["dark", false, "dark"],
  ] as const)(
    "%s with systemPrefersDark=%s is %s",
    (preference, prefersDark, expected) => {
      expect(resolveTheme(preference, prefersDark)).toBe(expected);
    },
  );
});

describe("stored preference", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to system when missing", () => {
    expect(loadThemePreference()).toBe("system");
  });

  it("falls back to system when invalid", () => {
    localStorage.setItem("eg26.theme", "purple");
    expect(loadThemePreference()).toBe("system");
  });

  it("round-trips a saved preference", () => {
    saveThemePreference("dark");
    expect(localStorage.getItem("eg26.theme")).toBe("dark");
    expect(loadThemePreference()).toBe("dark");
  });
});

describe("nextThemePreference", () => {
  it.each([
    ["system", "light"],
    ["light", "dark"],
    ["dark", "system"],
  ] as const)("%s -> %s", (current, expected) => {
    expect(nextThemePreference(current)).toBe(expected);
  });
});

describe("applyTheme", () => {
  it("toggles the dark class", () => {
    applyTheme("dark");
    expect(document.documentElement).toHaveClass("dark");
    applyTheme("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });
});
