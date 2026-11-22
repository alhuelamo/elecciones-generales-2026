export const INNER_RADIUS_RATIO = 0.4;
const SINGLE_SEAT_SPACING = 0.6;
const SEAT_RADIUS_FACTOR = 0.45;
const MIN_SEATS_FOR_MULTIPLE_ROWS = 5;

export interface SeatPosition {
  x: number;
  y: number;
  row: number;
  angle: number;
}

export function hemicycleRowCount(seatCount: number): number {
  if (seatCount < MIN_SEATS_FOR_MULTIPLE_ROWS) return 1;
  return Math.max(1, Math.round(Math.sqrt(seatCount / 3)));
}

export function hemicycleRowSeats(seatCount: number): number[] {
  return largestRemainderSeats(
    seatCount,
    rowRadii(hemicycleRowCount(seatCount)),
  );
}

export function hemicycleSeatPositions(seatCount: number): SeatPosition[] {
  const radii = rowRadii(hemicycleRowCount(seatCount));
  const rowSeats = largestRemainderSeats(seatCount, radii);
  return rowSeats
    .flatMap((seats, row) =>
      rowAngles(seats).map((angle) => ({
        x: radii[row] * Math.cos(angle),
        y: radii[row] * Math.sin(angle),
        row,
        angle,
      })),
    )
    .sort((a, b) => b.angle - a.angle || a.row - b.row);
}

export function hemicycleSeatRadius(positions: SeatPosition[]): number {
  if (positions.length < 2) return SEAT_RADIUS_FACTOR * SINGLE_SEAT_SPACING;
  return SEAT_RADIUS_FACTOR * minimumPairwiseDistance(positions);
}

function rowRadii(rowCount: number): number[] {
  if (rowCount === 1) return [1];
  const step = (1 - INNER_RADIUS_RATIO) / (rowCount - 1);
  return Array.from(
    { length: rowCount },
    (_, row) => INNER_RADIUS_RATIO + row * step,
  );
}

function largestRemainderSeats(seatCount: number, radii: number[]): number[] {
  const radiiTotal = radii.reduce((total, radius) => total + radius, 0);
  const exactShares = radii.map((radius) => (seatCount * radius) / radiiTotal);
  const seats = exactShares.map(Math.floor);
  const missing = seatCount - seats.reduce((total, count) => total + count, 0);
  exactShares
    .map((share, row) => ({ row, remainder: share - Math.floor(share) }))
    .sort((a, b) => b.remainder - a.remainder || b.row - a.row)
    .slice(0, missing)
    .forEach(({ row }) => {
      seats[row] += 1;
    });
  return seats;
}

function rowAngles(seatCount: number): number[] {
  if (seatCount === 1) return [Math.PI / 2];
  return Array.from(
    { length: seatCount },
    (_, index) => Math.PI * (1 - index / (seatCount - 1)),
  );
}

function minimumPairwiseDistance(positions: SeatPosition[]): number {
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
