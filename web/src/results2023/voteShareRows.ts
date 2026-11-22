import type {
  ConstituencyResults2023,
  PartyResult2023,
} from "../contract/types";

export const MINIMUM_SHARE_PERCENTAGE = 1;

export type VoteShareRow =
  | {
      kind: "party";
      acronym: string;
      name: string;
      percentage: number;
      color: string | null;
    }
  | { kind: "others"; percentage: number }
  | { kind: "blank"; percentage: number };

function isVisibleParty({ percentage }: PartyResult2023): boolean {
  return (percentage ?? 0) >= MINIMUM_SHARE_PERCENTAGE;
}

function byVotesDescending(first: PartyResult2023, second: PartyResult2023) {
  return (second.votes ?? 0) - (first.votes ?? 0);
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function othersRow(
  groupedParties: PartyResult2023[],
  validVotes: number,
): VoteShareRow[] {
  if (groupedParties.length === 0) return [];
  const groupedVotes = groupedParties.reduce(
    (total, { votes }) => total + (votes ?? 0),
    0,
  );
  return [
    {
      kind: "others",
      percentage: roundToTwoDecimals((groupedVotes / validVotes) * 100),
    },
  ];
}

export function voteShareRows(
  results: ConstituencyResults2023,
): VoteShareRow[] {
  const partyRows: VoteShareRow[] = results.parties
    .filter(isVisibleParty)
    .sort(byVotesDescending)
    .map(({ acronym, name, percentage, color }) => ({
      kind: "party",
      acronym,
      name,
      percentage: percentage ?? 0,
      color,
    }));
  const groupedParties = results.parties.filter(
    (party) => !isVisibleParty(party),
  );
  return [
    ...partyRows,
    ...othersRow(groupedParties, results.validVotes),
    { kind: "blank", percentage: results.blankPercentage ?? 0 },
  ];
}
