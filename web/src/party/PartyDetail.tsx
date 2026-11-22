import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Candidacy, Chamber, PartyProfile } from "../contract/types";
import { BUTTON_CLASSES } from "../design/button";
import { BallotPaper } from "./BallotPaper";
import { PartyFacts } from "./PartyFacts";
import { PartyLinks } from "./PartyLinks";

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
      <ul className="flex flex-nowrap gap-2">
        <li className="shrink-0">
          <a
            href={props.backHref}
            className={`${BUTTON_CLASSES} w-11 sm:w-auto`}
          >
            <span aria-hidden="true">‹</span>
            <span className="sr-only sm:not-sr-only">{t("back")}</span>
          </a>
        </li>
        {props.profile && <PartyLinks profile={props.profile} />}
      </ul>
      <header>
        <h1 className="font-display text-2xl font-bold">
          {candidacy.denomination}
        </h1>
        <p className="text-ink-muted">{candidacy.acronym}</p>
        {candidacy.isCoalition && <p className="text-sm">{t("coalition")}</p>}
      </header>
      {props.profile && <PartyFacts profile={props.profile} />}
      <BallotPaper
        candidacy={candidacy}
        chamber={props.chamber}
        maxMarks={props.maxMarks ?? 0}
        logo={props.profile?.logo ?? null}
      />
    </article>
  );
}
