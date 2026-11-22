import { useTranslation } from "react-i18next";
import { CandidacyList } from "../candidacies/CandidacyList";
import type {
  Candidacy,
  Chamber,
  ConstituencyBallot,
  ConstituencySummary,
  Language,
  Municipality,
  MunicipalityIndex,
  PartyCatalog,
} from "../contract/types";
import { ChamberTabs } from "./ChamberTabs";
import { HowToVote } from "./HowToVote";
import { MunicipalitySwitcher } from "./MunicipalitySwitcher";
import { WhereToVote } from "./WhereToVote";
import { Results2023Block } from "../results2023/Results2023Block";
import { SeatsSummary } from "./SeatsSummary";

export function ConstituencyView(props: {
  index: MunicipalityIndex;
  onMunicipalitySelect: (municipality: Municipality) => void;
  municipality: Municipality;
  constituency: ConstituencySummary;
  ballot: ConstituencyBallot;
  partyCatalog: PartyCatalog | null;
  chamberHref: (chamber: Chamber) => string;
  candidacyHref: (candidacy: Candidacy) => string;
}) {
  const { i18n } = useTranslation("constituency");
  const { ballot } = props;
  const language = i18n.language as Language;
  const municipalityName = props.municipality.name[language];
  const constituencyName = props.constituency.name[language];
  return (
    <div className="flex flex-col gap-4">
      <MunicipalitySwitcher
        index={props.index}
        onSelect={props.onMunicipalitySelect}
      >
        <header>
          <h1 className="font-display text-2xl font-bold">
            {municipalityName}
          </h1>
          {constituencyName !== municipalityName && <p>{constituencyName}</p>}
        </header>
      </MunicipalitySwitcher>
      <ChamberTabs active={ballot.chamber} chamberHref={props.chamberHref} />
      <SeatsSummary
        chamber={ballot.chamber}
        seats={ballot.seats}
        maxMarks={ballot.maxMarks}
      />
      <HowToVote chamber={ballot.chamber} maxMarks={ballot.maxMarks} />
      <WhereToVote />
      <Results2023Block ballot={ballot} constituencyName={constituencyName} />
      <CandidacyList
        candidacies={ballot.candidacies}
        chamber={ballot.chamber}
        partyCatalog={props.partyCatalog}
        hrefFor={props.candidacyHref}
      />
    </div>
  );
}
