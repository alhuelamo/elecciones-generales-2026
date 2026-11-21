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
    <nav aria-label={tConstituency("tabsLabel")} className="flex gap-2">
      {CHAMBERS.map((chamber) => (
        <a
          key={chamber}
          href={props.chamberHref(chamber)}
          aria-current={chamber === props.active ? "page" : undefined}
          className={
            chamber === props.active
              ? "rounded-t border-b-2 px-4 py-2 font-semibold"
              : "rounded-t px-4 py-2 opacity-70"
          }
        >
          {t(`chamber.${chamber}`)}
        </a>
      ))}
    </nav>
  );
}
