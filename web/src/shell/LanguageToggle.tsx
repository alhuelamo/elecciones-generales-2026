import { useTranslation } from "react-i18next";
import type { Language } from "../contract/types";

const LANGUAGES: readonly Language[] = ["es", "ca"];

export function LanguageToggle(props: {
  active: Language;
  onChange: (language: Language) => void;
}) {
  const { t } = useTranslation("shell");
  return (
    <div role="group" aria-label={t("language.label")} className="flex gap-1">
      {LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          lang={language}
          aria-pressed={props.active === language}
          onClick={() => props.onChange(language)}
          className="rounded px-2 py-1 text-sm uppercase hover:bg-gray-200 aria-pressed:bg-gray-800 aria-pressed:text-white dark:hover:bg-gray-700 dark:aria-pressed:bg-gray-100 dark:aria-pressed:text-gray-900"
        >
          {language}
        </button>
      ))}
    </div>
  );
}
