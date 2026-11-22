import { useTranslation } from "react-i18next";
import type { Chamber, ConstituencyResults2023 } from "../contract/types";
import { hemicycleSeatPositions, hemicycleSeatRadius } from "./hemicycle";
import { partyColor } from "./partyColor";
import { seatColors, seatParties, totalSeats } from "./seatAllocation";
import { SeatLegend } from "./SeatLegend";
import { seatLegendText } from "./seatLegendText";

export const HEMICYCLE_MIN_SEATS = 10;

interface SeatChartProps {
  chamber: Chamber;
  results: ConstituencyResults2023;
}

function Hemicycle(props: { colors: string[]; legendText: string }) {
  const positions = hemicycleSeatPositions(props.colors.length);
  const radius = hemicycleSeatRadius(positions);
  return (
    <svg
      viewBox="-1.1 -1.1 2.2 1.2"
      role="img"
      aria-label={props.legendText}
      className="w-full mx-auto max-w-72"
    >
      {positions.map(({ x, y }, index) => (
        <circle
          key={index}
          cx={x}
          cy={-y}
          r={radius}
          fill={props.colors[index]}
        />
      ))}
    </svg>
  );
}

function Dots(props: { colors: string[]; legendText: string }) {
  return (
    <>
      <ul aria-hidden="true" className="flex flex-wrap gap-1">
        {props.colors.map((fill, index) => (
          <li
            key={index}
            className="size-2.5 rounded-full"
            style={{ backgroundColor: fill }}
          />
        ))}
      </ul>
      <span className="sr-only">{props.legendText}</span>
    </>
  );
}

export function SeatChart({ chamber, results }: SeatChartProps) {
  const { t } = useTranslation("results2023");
  const parties = seatParties(results);
  const colors = seatColors(parties).map(partyColor);
  const legendText = seatLegendText(parties);
  const useHemicycle =
    chamber === "congreso" && totalSeats(results) >= HEMICYCLE_MIN_SEATS;
  const Chart = useHemicycle ? Hemicycle : Dots;
  return (
    <section aria-label={t("seats.label")} className="flex flex-col gap-2">
      <Chart colors={colors} legendText={legendText} />
      <SeatLegend parties={parties} />
      {chamber === "senado" && (
        <p className="text-sm text-ink-muted">{t("seats.senadoNote")}</p>
      )}
    </section>
  );
}
