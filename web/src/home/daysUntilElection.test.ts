import { describe, expect, it } from "vitest";
import { daysUntilElection } from "./daysUntilElection";

describe("daysUntilElection", () => {
  it.each([
    ["2026-11-21T12:00:00+01:00", 8],
    ["2026-11-28T23:30:00+01:00", 1],
    ["2026-11-28T00:05:00+01:00", 1],
    ["2026-11-27T23:59:00+01:00", 2],
    ["2026-11-28T23:30:00-05:00", 0],
  ])("%s -> %d", (iso, days) => {
    expect(daysUntilElection(new Date(iso))).toBe(days);
  });
});
