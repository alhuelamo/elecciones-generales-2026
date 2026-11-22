import { useTranslation } from "react-i18next";
import type { Language } from "../contract/types";
import { buildHash } from "../routing/route";
import { ThemeMenu } from "../theme/ThemeMenu";
import { LanguageToggle } from "./LanguageToggle";

export function Header(props: {
  language: Language;
  onLanguageChange: (language: Language) => void;
}) {
  const { t } = useTranslation(["shell", "common"]);
  return (
    <header className="sticky top-0 z-10 h-14 bg-paper/95 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex h-14 flex-nowrap items-center justify-between gap-2 border-b border-rule">
          <a
            href={buildHash({ page: "home", language: props.language })}
            className="flex min-h-11 items-center gap-2 transition-colors duration-150"
          >
            <span
              aria-hidden="true"
              className="font-display text-xl font-bold tabular-nums"
            >
              29<span className="text-accent">·</span>N
            </span>
            <span className="sr-only font-bold sm:not-sr-only">
              {t("common:appTitle")}
            </span>
          </a>
          <nav
            aria-label={t("shell:navigation")}
            className="flex flex-nowrap items-center gap-2"
          >
            <LanguageToggle
              active={props.language}
              onChange={props.onLanguageChange}
            />
            <ThemeMenu />
          </nav>
        </div>
      </div>
    </header>
  );
}
