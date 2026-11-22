import { useTranslation } from "react-i18next";
import type { Chamber, ConstituencyResults2023 } from "../contract/types";
import { COLUMNS_CLASSES } from "./columns";
import { partyColor } from "./partyColor";
import { seatParties } from "./seatAllocation";
import type { PartyResult2023 } from "../contract/types";

interface SeatChartProps {
  chamber: Chamber;
  results: ConstituencyResults2023;
}

function SeatRow({ party }: { party: PartyResult2023 }) {
  const { t } = useTranslation("results2023");
  const fill = partyColor(party.color);
  return (
    <li className={`${COLUMNS_CLASSES} items-center text-sm`}>
      <span className="break-words">
        {party.acronym}
        <span className="sr-only">{party.name}</span>
      </span>
      <span aria-hidden="true" className="flex flex-wrap gap-1">
        {Array.from({ length: party.seats }, (_, index) => (
          <span
            key={index}
            data-testid="seat-dot"
            className="size-2.5 rounded-full"
            style={{ backgroundColor: fill }}
          />
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

export function SeatChart({ chamber, results }: SeatChartProps) {
  const { t } = useTranslation("results2023");
  return (
    <section className="flex flex-col gap-2 border-t border-rule pt-3">
      <ul aria-label={t("seats.label")} className="flex flex-col gap-1.5">
        {seatParties(results).map((party) => (
          <SeatRow key={party.acronym} party={party} />
        ))}
      </ul>
      {chamber === "senado" && (
        <p className="text-sm text-ink-muted">{t("seats.senadoNote")}</p>
      )}
    </section>
  );
}
