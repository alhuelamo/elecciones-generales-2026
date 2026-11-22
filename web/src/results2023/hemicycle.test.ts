import { describe, expect, it } from "vitest";
import {
  INNER_RADIUS_RATIO,
  hemicycleRowCount,
  hemicycleRowSeats,
  hemicycleSeatPositions,
  hemicycleSeatRadius,
} from "./hemicycle";

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function minimumPairwiseDistance(positions: { x: number; y: number }[]) {
  let minimum = Infinity;
  positions.forEach((first, index) => {
    positions.slice(index + 1).forEach((second) => {
      minimum = Math.min(
        minimum,
        Math.hypot(first.x - second.x, first.y - second.y),
      );
    });
  });
  return minimum;
}

describe("hemicycleRowCount", () => {
  it.each([
    [1, 1],
    [4, 1],
    [5, 1],
    [10, 2],
    [12, 2],
    [16, 2],
    [32, 3],
    [37, 4],
  ])("uses %i seats -> %i rows", (seatCount, expected) => {
    expect(hemicycleRowCount(seatCount)).toBe(expected);
  });
});

describe("hemicycleRowSeats", () => {
  it.each([
    [10, [3, 7]],
    [32, [6, 11, 15]],
    [37, [5, 8, 11, 13]],
    [3, [3]],
  ])("splits %i seats into %j", (seatCount, expected) => {
    expect(hemicycleRowSeats(seatCount)).toEqual(expected);
  });

  it.each([1, 3, 5, 10, 17, 25, 32, 37, 40])(
    "sums to %i and never shrinks outwards",
    (seatCount) => {
      const rowSeats = hemicycleRowSeats(seatCount);
      expect(sum(rowSeats)).toBe(seatCount);
      rowSeats.slice(1).forEach((seats, index) => {
        expect(seats).toBeGreaterThanOrEqual(rowSeats[index]);
      });
    },
  );
});

describe("hemicycleSeatPositions", () => {
  it.each(Array.from({ length: 40 }, (_, index) => index + 1))(
    "places %i seats on the upper half disc, leftmost first",
    (seatCount) => {
      const positions = hemicycleSeatPositions(seatCount);
      expect(positions).toHaveLength(seatCount);
      positions.slice(1).forEach((position, index) => {
        expect(position.angle).toBeLessThanOrEqual(positions[index].angle);
      });
      positions.forEach((position) => {
        const radius = Math.hypot(position.x, position.y);
        expect(position.y).toBeGreaterThanOrEqual(0);
        expect(radius).toBeGreaterThanOrEqual(INNER_RADIUS_RATIO - 1e-9);
        expect(radius).toBeLessThanOrEqual(1 + 1e-9);
      });
    },
  );

  it("starts on the left end for multi-seat rows", () => {
    const [first] = hemicycleSeatPositions(10);
    expect(first.angle).toBe(Math.PI);
    expect(first.x).toBeLessThan(0);
  });

  it("breaks angle ties with the inner row first", () => {
    const [first, second] = hemicycleSeatPositions(10);
    expect([first.row, second.row]).toEqual([0, 1]);
  });

  it("places a single seat at the top of the unit circle", () => {
    const [seat] = hemicycleSeatPositions(1);
    expect(seat.angle).toBeCloseTo(Math.PI / 2);
    expect(Math.hypot(seat.x, seat.y)).toBeCloseTo(1);
  });
});

describe("hemicycleSeatRadius", () => {
  it.each([10, 37])("keeps %i seats from overlapping", (seatCount) => {
    const positions = hemicycleSeatPositions(seatCount);
    expect(2 * hemicycleSeatRadius(positions)).toBeLessThan(
      minimumPairwiseDistance(positions),
    );
  });

  it.each([10, 37, 350])("leaves air between %i seats", (seatCount) => {
    const positions = hemicycleSeatPositions(seatCount);
    expect(2 * hemicycleSeatRadius(positions)).toBeLessThanOrEqual(
      0.65 * minimumPairwiseDistance(positions),
    );
  });

  it("falls back to the row spacing for a single seat", () => {
    expect(hemicycleSeatRadius(hemicycleSeatPositions(1))).toBeCloseTo(0.18);
  });
});
