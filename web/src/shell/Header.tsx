import { useTranslation } from "react-i18next";
import type { Language } from "../contract/types";
import { buildHash } from "../routing/route";
import { ThemeToggle } from "../theme/ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";

export function Header(props: {
  language: Language;
  onLanguageChange: (language: Language) => void;
}) {
  const { t } = useTranslation(["shell", "common"]);
  return (
    <header className="border-b border-gray-200 dark:border-gray-700">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <a
          href={buildHash({ page: "home", language: props.language })}
          className="font-bold"
        >
          {t("common:appTitle")}
        </a>
        <nav
          aria-label={t("shell:navigation")}
          className="flex items-center gap-2"
        >
          <a
            href={buildHash({ page: "about", language: props.language })}
            className="rounded px-2 py-1 text-sm underline"
          >
            {t("shell:about")}
          </a>
          <LanguageToggle
            active={props.language}
            onChange={props.onLanguageChange}
          />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
