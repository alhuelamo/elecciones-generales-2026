import { Fragment } from "react";
import type { PartyResult2023 } from "../contract/types";
import { needsOutline, partyColor } from "./partyColor";

function Swatch({ color }: { color: string | null }) {
  const fill = partyColor(color);
  const outline = needsOutline(fill) ? " outline outline-1 outline-ink" : "";
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-3 shrink-0${outline}`}
      style={{ backgroundColor: fill }}
    />
  );
}

export function SeatLegend({ parties }: { parties: PartyResult2023[] }) {
  return (
    <p data-testid="seat-legend" className="text-sm">
      {parties.map(({ acronym, seats, color }, index) => (
        <Fragment key={acronym}>
          {index > 0 && " · "}
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Swatch color={color} />
            {`${acronym} ${seats}`}
          </span>
        </Fragment>
      ))}
    </p>
  );
}
