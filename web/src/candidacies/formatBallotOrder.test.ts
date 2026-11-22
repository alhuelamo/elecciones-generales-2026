import { describe, expect, it } from "vitest";
import { formatBallotOrder } from "./formatBallotOrder";

describe("formatBallotOrder", () => {
  it.each([
    [1, "01"],
    [12, "12"],
  ])("formats %i as %s", (order, expected) => {
    expect(formatBallotOrder(order)).toBe(expected);
  });
});
