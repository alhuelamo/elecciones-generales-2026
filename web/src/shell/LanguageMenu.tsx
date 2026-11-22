import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import type { Language } from "../contract/types";
import { BUTTON_CLASSES } from "../design/button";
import { LANGUAGE_NATIVE_NAMES, SUPPORTED_LANGUAGES } from "../i18n/languages";

export function LanguageMenu(props: {
  active: Language;
  onChange: (language: Language) => void;
}) {
  const { t } = useTranslation("shell");
  return (
    <Menu as="div" className="relative">
      <MenuButton
        aria-label={`${t("language.label")}: ${LANGUAGE_NATIVE_NAMES[props.active]}`}
        className={`${BUTTON_CLASSES} min-w-11 text-sm`}
      >
        {props.active.toUpperCase()}
      </MenuButton>
      <MenuItems className="absolute right-0 z-20 mt-1 min-w-40 rounded-frame border border-rule bg-paper py-1 shadow-md">
        {SUPPORTED_LANGUAGES.map((language) => (
          <MenuItem key={language}>
            <button
              type="button"
              lang={language}
              onClick={() => props.onChange(language)}
              className="flex min-h-11 w-full items-center justify-between gap-2 px-3 text-left transition-colors duration-150 data-focus:bg-kraft"
            >
              {LANGUAGE_NATIVE_NAMES[language]}
              {language === props.active && <span aria-hidden="true">✓</span>}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
