import { useTranslation } from "react-i18next";
import type { Language } from "../contract/types";

const LANGUAGES: readonly Language[] = ["es", "ca"];

export function LanguageToggle(props: {
  active: Language;
  onChange: (language: Language) => void;
}) {
  const { t } = useTranslation("shell");
  return (
    <div
      role="group"
      aria-label={t("language.label")}
      className="flex overflow-hidden rounded border border-rule"
    >
      {LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          lang={language}
          aria-pressed={props.active === language}
          onClick={() => props.onChange(language)}
          className="min-h-11 min-w-11 text-sm font-medium uppercase transition-colors duration-150 hover:bg-kraft aria-pressed:bg-ink aria-pressed:text-paper"
        >
          {language}
        </button>
      ))}
    </div>
  );
}
