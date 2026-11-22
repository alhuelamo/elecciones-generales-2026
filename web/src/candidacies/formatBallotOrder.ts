export function formatBallotOrder(boeOrder: number): string {
  return String(boeOrder).padStart(2, "0");
}
