import { useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  Candidacy,
  Chamber,
  Language,
  PartyCatalog,
} from "../contract/types";
import { formatBallotOrder } from "./formatBallotOrder";
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
        className="flex w-full divide-x divide-rule overflow-hidden rounded-frame border border-rule sm:inline-flex sm:w-auto"
      >
        {options.map((option) => (
          <label
            key={option}
            className="flex min-h-11 flex-1 cursor-pointer items-center justify-center px-2 text-center text-sm font-medium whitespace-nowrap transition-colors duration-150 hover:bg-kraft has-checked:bg-accent has-checked:text-paper has-checked:hover:bg-accent has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-accent sm:flex-none sm:px-4"
          >
            <input
              type="radio"
              name="candidacy-ordering"
              value={option}
              checked={ordering === option}
              onChange={() => setOrdering(option)}
              className="sr-only"
            />
            {t(`ordering.${option}`)}
          </label>
        ))}
      </div>
      <ul className="mt-3 divide-y divide-rule border-y border-rule">
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
    <a
      href={props.href}
      className="group grid min-h-11 grid-cols-[2.5rem_auto_1fr_auto] items-center gap-3 px-1 py-3 hover:bg-paper-raised focus-visible:bg-paper-raised focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
    >
      <span className="tabular-nums text-ink-muted">
        {formatBallotOrder(candidacy.boeOrder)}
      </span>
      <PartyBadge
        acronym={candidacy.acronym}
        denomination={candidacy.denomination}
        logo={logo}
        size="small"
      />
      <span className="flex min-w-0 flex-col">
        <span className="font-semibold">{candidacy.denomination}</span>
        {candidacy.isCoalition && (
          <span className="text-xs text-ink-muted">{t("coalition")}</span>
        )}
        <Results2023Line candidacy={candidacy} />
      </span>
      <span
        aria-hidden="true"
        className="text-xl leading-none text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent group-focus-visible:text-accent"
      >
        ›
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
    <span className="text-sm tabular-nums text-ink-muted">
      {summary}
      {showsAlias &&
        ` (${t("results2023.as", { acronyms: results.asAcronyms.join(", ") })})`}
    </span>
  );
}
