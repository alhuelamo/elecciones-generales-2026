import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  applyTheme,
  loadThemePreference,
  nextThemePreference,
  resolveTheme,
  saveThemePreference,
  type ThemePreference,
} from "./themePreference";

const DARK_QUERY = "(prefers-color-scheme: dark)";

const ICONS: Record<ThemePreference, string> = {
  system: "◐",
  light: "☀",
  dark: "☾",
};

export function ThemeToggle() {
  const { t } = useTranslation("theme");
  const [preference, setPreference] = useState(loadThemePreference);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DARK_QUERY);
    const update = () =>
      applyTheme(resolveTheme(preference, mediaQuery.matches));
    update();
    if (preference !== "system") return;
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [preference]);

  function cycle() {
    const next = nextThemePreference(preference);
    saveThemePreference(next);
    setPreference(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={t(`toggle.${preference}`)}
      title={t(`toggle.${preference}`)}
      className="rounded px-2 py-1 text-lg hover:bg-gray-200 dark:hover:bg-gray-700"
    >
      <span aria-hidden="true">{ICONS[preference]}</span>
    </button>
  );
}
