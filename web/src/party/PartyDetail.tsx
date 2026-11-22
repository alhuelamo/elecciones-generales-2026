import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PARTIES_EDIT_URL } from "../config";
import type { Candidacy, Chamber, PartyProfile } from "../contract/types";
import { LINK_CHIP_CLASSES } from "./linkChip";
import { BallotPaper } from "./BallotPaper";
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
      <header>
        <h1 className="font-display text-2xl font-bold">
          {candidacy.denomination}
        </h1>
        <p className="text-ink-muted">{candidacy.acronym}</p>
        {candidacy.isCoalition && <p className="text-sm">{t("coalition")}</p>}
      </header>
      {props.profile && <PartyFacts profile={props.profile} />}
      <a
        href={PARTIES_EDIT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={LINK_CHIP_CLASSES}
      >
        {t("editOnGithub")}
      </a>
      <BallotPaper
        candidacy={candidacy}
        chamber={props.chamber}
        maxMarks={props.maxMarks ?? 0}
        logo={props.profile?.logo ?? null}
      />
    </article>
  );
}
