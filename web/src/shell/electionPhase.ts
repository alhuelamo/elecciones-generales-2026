export type ElectionPhase = "before" | "electionDay" | "over";

const ELECTION_DAY_START = Date.parse("2026-11-29T00:00:00+01:00");
const POLLS_CLOSED = Date.parse("2026-11-29T20:00:00+01:00");

export function electionPhase(now: Date): ElectionPhase {
  const time = now.getTime();
  if (time >= POLLS_CLOSED) return "over";
  if (time >= ELECTION_DAY_START) return "electionDay";
  return "before";
}
