import { useTranslation } from "react-i18next";
import { PartyBadge } from "../candidacies/PartyBadge";
import { PARTIES_EDIT_URL } from "../config";
import type { Candidacy, Chamber, PartyProfile } from "../contract/types";
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
  return (
    <article className="space-y-6">
      <a href={props.backHref} className="underline">
        {t("back")}
      </a>
      <header className="flex items-center gap-4">
        <PartyBadge
          acronym={candidacy.acronym}
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
      <CandidateList candidacy={candidacy} chamber={props.chamber} />
      {props.profile && <PartyFacts profile={props.profile} />}
      <a
        href={PARTIES_EDIT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-sm underline"
      >
        {t("editOnGithub")}
      </a>
    </article>
  );
}
