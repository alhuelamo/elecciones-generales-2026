import type { PartyResult2023 } from "../contract/types";
import { partyColor } from "./partyColor";

export function SeatLegend({ parties }: { parties: PartyResult2023[] }) {
  return (
    <p
      data-testid="seat-legend"
      className="flex flex-wrap gap-x-3 gap-y-1 text-sm"
    >
      {parties.map(({ acronym, seats, color }) => (
        <span
          key={acronym}
          className="inline-flex items-center gap-1.5 whitespace-nowrap"
        >
          <span
            aria-hidden="true"
            className="inline-block size-2 shrink-0 rounded-full"
            style={{ backgroundColor: partyColor(color) }}
          />
          {`${acronym} ${seats}`}
        </span>
      ))}
    </p>
  );
}
