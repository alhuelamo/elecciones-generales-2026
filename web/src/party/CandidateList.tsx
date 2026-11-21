import { useTranslation } from "react-i18next";
import type { Candidacy, Candidate, Chamber } from "../contract/types";

export function CandidateList(props: {
  candidacy: Candidacy;
  chamber: Chamber;
}) {
  const { t } = useTranslation("party");
  const showSubstitutes =
    props.chamber === "congreso" && props.candidacy.substitutes.length > 0;
  return (
    <div className="space-y-6">
      <ol aria-label={t("candidates")} className="space-y-2">
        {props.candidacy.candidates.map((candidate) => (
          <CandidateItem
            key={candidate.position}
            candidate={candidate}
            showSubstituteNames={props.chamber === "senado"}
          />
        ))}
      </ol>
      {showSubstitutes && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">{t("substitutes")}</h2>
          <ol aria-label={t("substitutes")} className="space-y-2">
            {props.candidacy.substitutes.map((substitute) => (
              <CandidateItem
                key={substitute.position}
                candidate={substitute}
                showSubstituteNames={false}
              />
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function CandidateItem(props: {
  candidate: Candidate;
  showSubstituteNames: boolean;
}) {
  const { t } = useTranslation("party");
  const { candidate } = props;
  const hasSubstituteNames =
    props.showSubstituteNames && candidate.substituteNames.length > 0;
  return (
    <li className="flex gap-3">
      <span className="w-6 shrink-0 text-right tabular-nums">
        {candidate.position}
      </span>
      <span>
        <span className="font-medium">{candidate.name}</span>
        {hasSubstituteNames && (
          <span className="block text-sm opacity-70">
            {t("substitutesOf", {
              names: candidate.substituteNames.join(", "),
            })}
          </span>
        )}
      </span>
    </li>
  );
}
