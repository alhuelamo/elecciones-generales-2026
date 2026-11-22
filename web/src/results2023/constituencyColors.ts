import type { ConstituencyResults2023 } from "../contract/types";
import {
  FALLBACK_PARTY_COLOR,
  NEUTRAL_PARTY_COLOR,
  colorDistance,
  harmonizePartyColor,
  harmonizePartyColorAtLightness,
  partyColor,
} from "./partyColor";
import { MINIMUM_SHARE_PERCENTAGE } from "./voteShareRows";

export const MINIMUM_COLOR_DISTANCE = 0.06;
export const SHIFTED_LIGHTNESS_VALUES = [0.45, 0.72];

export type PartyColorMap = Record<string, string>;

interface ColoredParty {
  acronym: string;
  color: string | null;
}

export function resolveDistinctColors(parties: ColoredParty[]): PartyColorMap {
  const assigned: string[] = [];
  const colors: PartyColorMap = {};
  parties.forEach(({ acronym, color }) => {
    const resolved = resolveColor(color, assigned);
    colors[acronym] = resolved;
    if (isComparable(resolved)) assigned.push(resolved);
  });
  return colors;
}

export function resolveResultsColors(
  results: ConstituencyResults2023,
): PartyColorMap {
  return resolveDistinctColors(displayedParties(results));
}

function displayedParties(results: ConstituencyResults2023) {
  return results.parties
    .filter(
      ({ seats, percentage }) =>
        seats > 0 || (percentage ?? 0) >= MINIMUM_SHARE_PERCENTAGE,
    )
    .sort(
      (first, second) =>
        (second.votes ?? 0) - (first.votes ?? 0) || second.seats - first.seats,
    );
}

function resolveColor(color: string | null, assigned: string[]): string {
  const canonical = partyColor(color);
  if (!isComparable(canonical) || color === null) return canonical;
  if (minimumDistance(canonical, assigned) >= MINIMUM_COLOR_DISTANCE) {
    return canonical;
  }
  return mostDistinctVariant(color, assigned);
}

function mostDistinctVariant(color: string, assigned: string[]): string {
  const candidates = [
    harmonizePartyColor(color),
    ...SHIFTED_LIGHTNESS_VALUES.map((lightness) =>
      harmonizePartyColorAtLightness(color, lightness),
    ),
  ];
  return candidates.reduce((best, candidate) =>
    minimumDistance(candidate, assigned) > minimumDistance(best, assigned)
      ? candidate
      : best,
  );
}

function minimumDistance(candidate: string, assigned: string[]): number {
  return Math.min(
    ...assigned.map((existing) => colorDistance(candidate, existing)),
  );
}

function isComparable(hex: string): boolean {
  return hex !== FALLBACK_PARTY_COLOR && hex !== NEUTRAL_PARTY_COLOR;
}
