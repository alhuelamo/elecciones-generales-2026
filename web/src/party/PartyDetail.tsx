import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Candidacy, Chamber, PartyProfile } from "../contract/types";
import { BUTTON_CLASSES } from "../design/button";
import { BallotPaper } from "./BallotPaper";
import { PartyFacts, type LocalHead } from "./PartyFacts";
import { PartyLinks } from "./PartyLinks";

export function PartyDetail(props: {
  candidacy: Candidacy;
  chamber: Chamber;
  maxMarks: number | null;
  profile: PartyProfile | null;
  constituencyName: string;
  backHref: string;
}) {
  const { t } = useTranslation("party");
  const { candidacy } = props;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <article className="space-y-6">
      <header className="flex items-start gap-3">
        <a
          href={props.backHref}
          title={t("back")}
          className={`${BUTTON_CLASSES} w-11 shrink-0`}
        >
          <span aria-hidden="true">‹</span>
          <span className="sr-only">{t("back")}</span>
        </a>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold">
            {candidacy.denomination}
          </h1>
          <p className="text-ink-muted">{candidacy.acronym}</p>
          {candidacy.isCoalition && <p className="text-sm">{t("coalition")}</p>}
        </div>
      </header>
      {props.profile && (
        <ul className="flex flex-nowrap gap-2">
          <PartyLinks profile={props.profile} />
        </ul>
      )}
      <PartyFacts profile={props.profile} localHead={findLocalHead(props)} />
      <BallotPaper
        candidacy={candidacy}
        chamber={props.chamber}
        maxMarks={props.maxMarks ?? 0}
        logo={props.profile?.logo ?? null}
      />
    </article>
  );
}

function findLocalHead(props: {
  candidacy: Candidacy;
  chamber: Chamber;
  constituencyName: string;
}): LocalHead | null {
  if (props.chamber !== "congreso") return null;
  const head = props.candidacy.candidates.find(
    (candidate) => candidate.position === 1,
  );
  return head
    ? { constituencyName: props.constituencyName, name: head.name }
    : null;
}
