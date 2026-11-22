import type {
  ConstituencyResults2023,
  PartyResult2023,
} from "../contract/types";

export function seatParties(
  results: ConstituencyResults2023,
): PartyResult2023[] {
  return results.parties
    .filter(({ seats }) => seats > 0)
    .sort(
      (first, second) =>
        second.seats - first.seats || (second.votes ?? 0) - (first.votes ?? 0),
    );
}

export function seatColors(parties: PartyResult2023[]): (string | null)[] {
  return parties.flatMap(({ seats, color }) => Array(seats).fill(color));
}

export function totalSeats(results: ConstituencyResults2023): number {
  return results.parties.reduce((total, { seats }) => total + seats, 0);
}
