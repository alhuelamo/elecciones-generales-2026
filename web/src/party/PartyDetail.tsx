import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PartyBadge } from "../candidacies/PartyBadge";
import { PARTIES_EDIT_URL } from "../config";
import type { Candidacy, Chamber, PartyProfile } from "../contract/types";
import { LINK_CHIP_CLASSES } from "./linkChip";
import { CandidateList } from "./CandidateList";
import { PartyFacts } from "./PartyFacts";

export function PartyDetail(props: {
  candidacy: Candidacy;
  chamber: Chamber;
  maxMarks: number | null;
  profile: PartyProfile | null;
  backHref: string;
}) {
  const { t } = useTranslation("party");
  const { candidacy } = props;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <article className="space-y-6">
      <a href={props.backHref} className="inline-block py-2 underline">
        {t("back")}
      </a>
      <header className="flex flex-wrap items-center gap-4">
        <PartyBadge
          acronym={candidacy.acronym}
          denomination={candidacy.denomination}
          logo={props.profile?.logo ?? null}
          size="large"
        />
        <div>
          <h1 className="text-2xl font-bold">{candidacy.denomination}</h1>
          <p className="opacity-70">{candidacy.acronym}</p>
          {candidacy.isCoalition && <p className="text-sm">{t("coalition")}</p>}
        </div>
      </header>
      {props.chamber === "senado" && props.maxMarks !== null && (
        <p>{t("senadoMarks", { maxMarks: props.maxMarks })}</p>
      )}
      {props.profile && <PartyFacts profile={props.profile} />}
      <a
        href={PARTIES_EDIT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={LINK_CHIP_CLASSES}
      >
        {t("editOnGithub")}
      </a>
      <CandidateList candidacy={candidacy} chamber={props.chamber} />
    </article>
  );
}
