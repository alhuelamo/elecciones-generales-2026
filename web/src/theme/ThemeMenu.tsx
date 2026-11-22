import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  applyTheme,
  loadThemePreference,
  resolveTheme,
  saveThemePreference,
  THEME_PREFERENCES,
  type ThemePreference,
} from "./themePreference";

const DARK_QUERY = "(prefers-color-scheme: dark)";

export function ThemeMenu() {
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

  function choose(next: ThemePreference) {
    saveThemePreference(next);
    setPreference(next);
  }

  return (
    <Menu as="div" className="relative">
      <MenuButton
        aria-label={t("menu.label", { choice: t(`choice.${preference}`) })}
        className="min-h-11 min-w-11 rounded text-lg transition-colors duration-150 hover:bg-kraft"
      >
        <span aria-hidden="true">◐</span>
      </MenuButton>
      <MenuItems className="absolute right-0 z-20 mt-1 min-w-40 rounded border border-rule bg-paper py-1 shadow-md">
        {THEME_PREFERENCES.map((option) => (
          <MenuItem key={option}>
            <button
              type="button"
              onClick={() => choose(option)}
              className="flex min-h-11 w-full items-center justify-between gap-2 px-3 text-left transition-colors duration-150 data-focus:bg-kraft"
            >
              {t(`choice.${option}`)}
              {option === preference && <span aria-hidden="true">✓</span>}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
