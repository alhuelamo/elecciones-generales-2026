import { ELECTION_DAY_START } from "../shell/electionPhase";

const MADRID_TIME_ZONE = "Europe/Madrid";
const MILLISECONDS_PER_DAY = 86_400_000;

const madridDateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: MADRID_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function madridCalendarDay(instant: Date): number {
  const parts = madridDateFormat.formatToParts(instant);
  const part = (type: string) =>
    Number(parts.find((candidate) => candidate.type === type)!.value);
  return Date.UTC(part("year"), part("month") - 1, part("day"));
}

export function daysUntilElection(now: Date): number {
  const electionDay = madridCalendarDay(new Date(ELECTION_DAY_START));
  return (electionDay - madridCalendarDay(now)) / MILLISECONDS_PER_DAY;
}
