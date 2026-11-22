import { useTranslation } from "react-i18next";
import type { Chamber } from "../contract/types";

const CHAMBERS: Chamber[] = ["congreso", "senado"];

export function ChamberTabs(props: {
  active: Chamber;
  chamberHref: (chamber: Chamber) => string;
}) {
  const { t } = useTranslation("common");
  const { t: tConstituency } = useTranslation("constituency");
  return (
    <nav
      aria-label={tConstituency("tabsLabel")}
      className="flex gap-2 border-b border-rule"
    >
      {CHAMBERS.map((chamber) => (
        <a
          key={chamber}
          href={props.chamberHref(chamber)}
          aria-current={chamber === props.active ? "page" : undefined}
          className={`-mb-px inline-flex min-h-11 items-center border-b-2 px-4 transition-colors duration-150 ${
            chamber === props.active
              ? "border-accent font-semibold text-ink"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          {t(`chamber.${chamber}`)}
        </a>
      ))}
    </nav>
  );
}
