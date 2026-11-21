import { describe, expect, it } from "vitest";
import { electionPhase } from "./electionPhase";

describe("electionPhase", () => {
  it.each([
    ["2026-11-28T23:59:59+01:00", "before"],
    ["2026-11-29T00:00:00+01:00", "electionDay"],
    ["2026-11-29T19:59:59+01:00", "electionDay"],
    ["2026-11-29T20:00:00+01:00", "over"],
    ["2026-12-01T10:00:00+01:00", "over"],
  ])("at %s is %s", (instant, expected) => {
    expect(electionPhase(new Date(instant))).toBe(expected);
  });
});
