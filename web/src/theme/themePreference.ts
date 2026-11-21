import { STORAGE_KEYS } from "../config";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const CYCLE: ThemePreference[] = ["system", "light", "dark"];

function isThemePreference(value: unknown): value is ThemePreference {
  return CYCLE.includes(value as ThemePreference);
}

export function loadThemePreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEYS.theme);
  return isThemePreference(stored) ? stored : "system";
}

export function saveThemePreference(preference: ThemePreference): void {
  localStorage.setItem(STORAGE_KEYS.theme, preference);
}

export function nextThemePreference(current: ThemePreference): ThemePreference {
  return CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === "system") return systemPrefersDark ? "dark" : "light";
  return preference;
}

export function applyTheme(theme: ResolvedTheme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}
