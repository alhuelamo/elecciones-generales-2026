import { useTranslation } from "react-i18next";
import type { Chamber, ConstituencyResults2023 } from "../contract/types";
import { COLUMNS_CLASSES } from "./columns";
import type { PartyColorMap } from "./constituencyColors";
import { FALLBACK_PARTY_COLOR } from "./partyColor";
import { seatParties } from "./seatAllocation";
import type { PartyResult2023 } from "../contract/types";

interface SeatChartProps {
  chamber: Chamber;
  results: ConstituencyResults2023;
  colors: PartyColorMap;
}

const DOTS_PER_CHUNK = 5;

function chunkSizes(seats: number): number[] {
  const fullChunks = Math.floor(seats / DOTS_PER_CHUNK);
  const remainder = seats % DOTS_PER_CHUNK;
  return [
    ...Array<number>(fullChunks).fill(DOTS_PER_CHUNK),
    ...(remainder > 0 ? [remainder] : []),
  ];
}

function SeatRow(props: { party: PartyResult2023; fill: string }) {
  const { party, fill } = props;
  const { t } = useTranslation("results2023");
  return (
    <li className={`${COLUMNS_CLASSES} items-center text-sm`}>
      <span className="break-words">
        {party.acronym}
        <span className="sr-only">{party.name}</span>
      </span>
      <span aria-hidden="true" className="flex flex-wrap gap-x-2 gap-y-1">
        {chunkSizes(party.seats).map((size, chunkIndex) => (
          <span
            key={chunkIndex}
            data-testid="seat-chunk"
            className="inline-flex gap-1"
          >
            {Array.from({ length: size }, (_, index) => (
              <span
                key={index}
                data-testid="seat-dot"
                className="size-2.5 rounded-full"
                style={{ backgroundColor: fill }}
              />
            ))}
          </span>
        ))}
      </span>
      <span className="tabular-nums text-right">
        {party.seats}
        <span className="sr-only">
          {" "}
          {t("seats.count", { count: party.seats })}
        </span>
      </span>
    </li>
  );
}

export function SeatChart({ chamber, results, colors }: SeatChartProps) {
  const { t } = useTranslation("results2023");
  return (
    <section className="flex flex-col gap-2 border-t border-rule pt-3">
      <ul aria-label={t("seats.label")} className="flex flex-col gap-1.5">
        {seatParties(results).map((party) => (
          <SeatRow
            key={party.acronym}
            party={party}
            fill={colors[party.acronym] ?? FALLBACK_PARTY_COLOR}
          />
        ))}
      </ul>
      {chamber === "senado" && (
        <p className="text-sm text-ink-muted">{t("seats.senadoNote")}</p>
      )}
    </section>
  );
}
