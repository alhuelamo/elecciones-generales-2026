import { useTranslation } from "react-i18next";
import type { ConstituencyResults2023 } from "../contract/types";
import { COLUMNS_CLASSES } from "./columns";
import { FALLBACK_PARTY_COLOR, partyColor } from "./partyColor";
import { voteShareRows, type VoteShareRow } from "./voteShareRows";

const THRESHOLD_PERCENTAGE = 3;

function rowScale(rows: VoteShareRow[]): number {
  return Math.max(...rows.map(({ percentage }) => percentage));
}

function asPercentageOfScale(value: number, scale: number): string {
  return `${(value / scale) * 100}%`;
}

function useShareFormatter(): (percentage: number) => string {
  const { i18n } = useTranslation();
  const formatter = new Intl.NumberFormat(i18n.language, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return (percentage) => `${formatter.format(percentage)} %`;
}

function ShareBar(props: { row: VoteShareRow; scale: number }) {
  const width = asPercentageOfScale(props.row.percentage, props.scale);
  if (props.row.kind === "blank") {
    return (
      <div
        aria-hidden="true"
        className="h-2.5 rounded-full border border-rule-strong bg-rule"
        style={{ width }}
      />
    );
  }
  const fill =
    props.row.kind === "others"
      ? FALLBACK_PARTY_COLOR
      : partyColor(props.row.color);
  return (
    <div
      aria-hidden="true"
      className="h-2.5 rounded-full"
      style={{ width, backgroundColor: fill }}
    />
  );
}

function RowLabel({ row }: { row: VoteShareRow }) {
  const { t } = useTranslation("results2023");
  if (row.kind === "party") {
    return (
      <span className="break-words">
        {row.acronym}
        <span className="sr-only">{row.name}</span>
      </span>
    );
  }
  if (row.kind === "blank") {
    return <span className="text-ink-muted">{t("voteShare.blank")}</span>;
  }
  return <span>{t("voteShare.others")}</span>;
}

function ThresholdMarker({ scale }: { scale: number }) {
  const { t } = useTranslation("results2023");
  return (
    <div className={`pointer-events-none absolute inset-0 ${COLUMNS_CLASSES}`}>
      <div className="relative col-start-2">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 border-l border-dashed border-ink-muted"
          style={{ left: asPercentageOfScale(THRESHOLD_PERCENTAGE, scale) }}
        />
        <span
          className="absolute -top-5 -translate-x-1/2 whitespace-nowrap text-xs text-ink-muted"
          style={{ left: asPercentageOfScale(THRESHOLD_PERCENTAGE, scale) }}
        >
          {t("voteShare.threshold")}
        </span>
      </div>
    </div>
  );
}

export function VoteShareChart({
  results,
}: {
  results: ConstituencyResults2023;
}) {
  const { t } = useTranslation("results2023");
  const formatShare = useShareFormatter();
  const rows = voteShareRows(results);
  const scale = rowScale(rows);
  return (
    <div className="relative mt-5">
      <ul aria-label={t("voteShare.label")} className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <li
            key={row.kind === "party" ? row.acronym : row.kind}
            className={`${COLUMNS_CLASSES} items-center text-sm`}
          >
            <RowLabel row={row} />
            <div className="relative">
              <ShareBar row={row} scale={scale} />
            </div>
            <span className="tabular-nums">{formatShare(row.percentage)}</span>
          </li>
        ))}
      </ul>
      <ThresholdMarker scale={scale} />
    </div>
  );
}
