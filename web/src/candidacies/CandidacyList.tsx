import { useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  Candidacy,
  Chamber,
  Language,
  PartyCatalog,
} from "../contract/types";
import { PartyBadge } from "./PartyBadge";
import { orderCandidacies, type CandidacyOrdering } from "./orderCandidacies";

export function CandidacyList(props: {
  candidacies: Candidacy[];
  chamber: Chamber;
  partyCatalog: PartyCatalog | null;
  hrefFor: (candidacy: Candidacy) => string;
}) {
  const { t, i18n } = useTranslation("candidacies");
  const language = i18n.language as Language;
  const [ordering, setOrdering] = useState<CandidacyOrdering>("boe");
  const hasResults = props.candidacies.some(
    (candidacy) => candidacy.results2023,
  );
  const options: CandidacyOrdering[] = hasResults
    ? ["boe", "alphabetical", "votes2023"]
    : ["boe", "alphabetical"];
  const ordered = orderCandidacies(props.candidacies, ordering, language);

  return (
    <div>
      <div
        role="radiogroup"
        aria-label={t("ordering.label")}
        className="flex flex-wrap gap-3"
      >
        {options.map((option) => (
          <label key={option} className="flex items-center gap-1">
            <input
              type="radio"
              name="candidacy-ordering"
              value={option}
              checked={ordering === option}
              onChange={() => setOrdering(option)}
            />
            {t(`ordering.${option}`)}
          </label>
        ))}
      </div>
      <ul className="mt-3 divide-y">
        {ordered.map((candidacy) => (
          <li key={candidacy.slug}>
            <CandidacyRow
              candidacy={candidacy}
              chamber={props.chamber}
              partyCatalog={props.partyCatalog}
              href={props.hrefFor(candidacy)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function CandidacyRow(props: {
  candidacy: Candidacy;
  chamber: Chamber;
  partyCatalog: PartyCatalog | null;
  href: string;
}) {
  const { t } = useTranslation("candidacies");
  const { candidacy } = props;
  const logo =
    (candidacy.partyKey &&
      props.partyCatalog?.parties[candidacy.partyKey]?.logo) ||
    null;
  return (
    <a href={props.href} className="flex items-center gap-3 py-2">
      <PartyBadge acronym={candidacy.acronym} logo={logo} size="small" />
      <span className="flex flex-col">
        <span>{candidacy.denomination}</span>
        {candidacy.isCoalition && (
          <span className="text-xs">{t("coalition")}</span>
        )}
        <Results2023Line candidacy={candidacy} />
      </span>
    </a>
  );
}

function Results2023Line(props: { candidacy: Candidacy }) {
  const { t, i18n } = useTranslation("candidacies");
  const results = props.candidacy.results2023;
  if (!results) return null;
  const percentage =
    results.percentage === null
      ? null
      : `${new Intl.NumberFormat(i18n.language, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(results.percentage)} %`;
  const summary = t(
    percentage === null ? "results2023.senado" : "results2023.congreso",
    { percentage, seats: results.seats },
  );
  const showsAlias =
    results.asAcronyms.length > 0 &&
    results.asAcronyms.join() !== props.candidacy.acronym;
  return (
    <span className="text-xs">
      {summary}
      {showsAlias &&
        ` (${t("results2023.as", { acronyms: results.asAcronyms.join(", ") })})`}
    </span>
  );
}
