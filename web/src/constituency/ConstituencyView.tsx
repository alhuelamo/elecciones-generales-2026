import { useTranslation } from "react-i18next";
import { CandidacyList } from "../candidacies/CandidacyList";
import type {
  Candidacy,
  Chamber,
  ConstituencyBallot,
  ConstituencySummary,
  Language,
  Municipality,
  PartyCatalog,
} from "../contract/types";
import { ChamberTabs } from "./ChamberTabs";
import { HowToVote } from "./HowToVote";
import { WhereToVote } from "./WhereToVote";
import { SeatsSummary } from "./SeatsSummary";

export function ConstituencyView(props: {
  municipality: Municipality;
  constituency: ConstituencySummary;
  ballot: ConstituencyBallot;
  partyCatalog: PartyCatalog | null;
  chamberHref: (chamber: Chamber) => string;
  candidacyHref: (candidacy: Candidacy) => string;
}) {
  const { i18n } = useTranslation("constituency");
  const { ballot } = props;
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-2xl font-bold">
          {props.municipality.name[i18n.language as Language]}
        </h1>
        <p>{props.constituency.name[i18n.language as Language]}</p>
      </header>
      <ChamberTabs active={ballot.chamber} chamberHref={props.chamberHref} />
      <SeatsSummary
        chamber={ballot.chamber}
        seats={ballot.seats}
        maxMarks={ballot.maxMarks}
      />
      <HowToVote chamber={ballot.chamber} maxMarks={ballot.maxMarks} />
      <WhereToVote />
      <CandidacyList
        candidacies={ballot.candidacies}
        chamber={ballot.chamber}
        partyCatalog={props.partyCatalog}
        hrefFor={props.candidacyHref}
      />
    </div>
  );
}
