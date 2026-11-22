import { useId } from "react";
import { useTranslation } from "react-i18next";
import { SOURCE_URLS } from "../config";
import type { ConstituencyBallot } from "../contract/types";
import { ExternalLink } from "../design/ExternalLink";
import { useNumberFormat } from "../i18n/useNumberFormat";
import { resolveResultsColors } from "./constituencyColors";
import { SeatChart } from "./SeatChart";
import { VoteShareChart } from "./VoteShareChart";

function Caption(props: { turnoutPercentage: number; totalVotes: number }) {
  const { t } = useTranslation("results2023");
  const turnout = useNumberFormat({
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(props.turnoutPercentage);
  const votes = useNumberFormat().format(props.totalVotes);
  return (
    <p className="text-sm text-ink-muted">
      {t("turnout", { turnout: `${turnout} %` })} · {t("votes", { votes })} ·{" "}
      <ExternalLink href={SOURCE_URLS.interior} className="underline">
        {t("source")}
      </ExternalLink>
    </p>
  );
}

export function Results2023Block(props: {
  ballot: ConstituencyBallot;
  constituencyName: string;
}) {
  const { t } = useTranslation("results2023");
  const headingId = useId();
  const { chamber, constituencyResults2023: results } = props.ballot;
  if (!results) return null;
  const colors = resolveResultsColors(results);
  const constituency = results.combinedDistrictName ?? props.constituencyName;
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-frame border border-rule bg-paper p-4"
    >
      <h2 id={headingId} className="font-display text-lg font-semibold">
        {t("heading", { constituency })}
      </h2>
      {results.combinedDistrictName && (
        <p className="text-sm text-ink-muted">{t("combinedDistrict")}</p>
      )}
      {chamber === "congreso" && (
        <VoteShareChart results={results} colors={colors} />
      )}
      <SeatChart chamber={chamber} results={results} colors={colors} />
      <Caption
        turnoutPercentage={results.turnoutPercentage}
        totalVotes={results.totalVotes}
      />
    </section>
  );
}
