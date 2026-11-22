import { useTranslation } from "react-i18next";
import { WhereToVote } from "../constituency/WhereToVote";
import type { Language } from "../contract/types";
import type { Route } from "../routing/route";
import { MunicipalitySearch } from "../search/MunicipalitySearch";
import type { BallotData } from "../shell/useBallotData";
import { ElectionCountdown } from "./ElectionCountdown";
import { HowToVoteCard } from "./HowToVoteCard";

export function HomePage(props: {
  language: Language;
  data: BallotData;
  navigate: (route: Route) => void;
}) {
  const { t } = useTranslation("home");
  return (
    <section className="flex flex-col gap-4">
      <ElectionCountdown />
      <h1 className="font-display text-3xl sm:text-4xl">{t("title")}</h1>
      <p>{t("subtitle")}</p>
      <MunicipalitySearch
        index={props.data.index!}
        onSelect={(municipality) =>
          props.navigate({
            page: "ballot",
            language: props.language,
            municipalityCode: municipality.code,
            chamber: "congreso",
            partySlug: null,
          })
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-sm border border-rule bg-paper-raised p-4">
          <h2 className="font-display text-xl">{t("cards.whereToVote")}</h2>
          <WhereToVote />
        </section>
        <HowToVoteCard />
      </div>
    </section>
  );
}
