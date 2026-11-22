import { useId } from "react";
import { useTranslation } from "react-i18next";
import { PartyBadge } from "../candidacies/PartyBadge";
import type { Candidacy, Chamber, PartyLogo } from "../contract/types";
import { CHAMBER_SURFACE_CLASSES } from "../design/chamberSurface";
import { CandidateList } from "./CandidateList";

export function BallotPaper(props: {
  candidacy: Candidacy;
  chamber: Chamber;
  maxMarks: number;
  logo?: PartyLogo | null;
}) {
  const { t } = useTranslation("party");
  const { candidacy } = props;
  const captionId = useId();
  return (
    <figure
      aria-labelledby={captionId}
      className={`${CHAMBER_SURFACE_CLASSES[props.chamber]} mx-auto max-w-md p-5 shadow-sm`}
    >
      <header className="mb-4 flex items-center gap-3 border-b border-rule-strong pb-4">
        <PartyBadge
          acronym={candidacy.acronym}
          denomination={candidacy.denomination}
          logo={props.logo ?? null}
          size="large"
        />
        <p className="font-semibold uppercase">{candidacy.denomination}</p>
      </header>
      {props.chamber === "senado" && (
        <p className="mb-4 text-sm">
          {t("senadoMarks", { count: props.maxMarks })}
        </p>
      )}
      <CandidateList candidacy={candidacy} chamber={props.chamber} />
      <figcaption
        id={captionId}
        className="mt-4 border-t border-rule pt-3 text-xs text-ink-muted"
      >
        {t("ballot.caption")}
      </figcaption>
    </figure>
  );
}
