import type { PartyResult2023 } from "../contract/types";

export function seatLegendText(parties: PartyResult2023[]): string {
  return parties.map(({ acronym, seats }) => `${acronym} ${seats}`).join(", ");
}
