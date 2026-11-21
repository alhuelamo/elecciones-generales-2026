import type { Candidacy, Language } from "../contract/types";

export type CandidacyOrdering = "boe" | "alphabetical" | "votes2023";

function byBoeOrder(first: Candidacy, second: Candidacy): number {
  return first.boeOrder - second.boeOrder;
}

function votesOf(candidacy: Candidacy): number {
  return candidacy.results2023?.votes ?? 0;
}

function byVotesDescending(first: Candidacy, second: Candidacy): number {
  if (!first.results2023 && !second.results2023)
    return byBoeOrder(first, second);
  if (!first.results2023) return 1;
  if (!second.results2023) return -1;
  return votesOf(second) - votesOf(first) || byBoeOrder(first, second);
}

export function orderCandidacies(
  candidacies: Candidacy[],
  ordering: CandidacyOrdering,
  language: Language,
): Candidacy[] {
  const collator = new Intl.Collator(language, { sensitivity: "base" });
  const comparators: Record<
    CandidacyOrdering,
    (first: Candidacy, second: Candidacy) => number
  > = {
    boe: byBoeOrder,
    alphabetical: (first, second) =>
      collator.compare(first.denomination, second.denomination) ||
      byBoeOrder(first, second),
    votes2023: byVotesDescending,
  };
  return [...candidacies].sort(comparators[ordering]);
}
