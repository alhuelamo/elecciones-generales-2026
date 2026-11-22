import { useTranslation } from "react-i18next";
import type { Chamber } from "../contract/types";
import { Envelope } from "../design/Envelope";

const CHAMBERS: readonly Chamber[] = ["congreso", "senado"];

export function HowToVoteCard() {
  const { t } = useTranslation("home");
  return (
    <section className="rounded-sm border border-rule bg-paper-raised p-4">
      <h2 className="font-display text-xl">{t("cards.howToVote")}</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {CHAMBERS.map((chamber) => (
          <li key={chamber} className="flex items-start gap-3 text-sm">
            <Envelope chamber={chamber} className="h-8 w-8 shrink-0" />
            <span>{t(`cards.${chamber}`)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
