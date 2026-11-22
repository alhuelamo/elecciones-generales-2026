import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fixtureCongresoResults2023 } from "../test/fixtures";
import { seatParties } from "./seatAllocation";
import { SeatLegend } from "./SeatLegend";

describe("SeatLegend", () => {
  it("lists acronyms and seats as wrapping items without separators", () => {
    render(<SeatLegend parties={seatParties(fixtureCongresoResults2023)} />);
    const items = Array.from(screen.getByTestId("seat-legend").children);
    expect(items.map((item) => item.textContent)).toEqual([
      "PEA 4",
      "PEB 2",
      "CEC-D 2",
    ]);
    expect(screen.getByTestId("seat-legend")).toHaveClass(
      "flex-wrap",
      "gap-x-3",
      "gap-y-1",
    );
    items.forEach((item) => expect(item).toHaveClass("whitespace-nowrap"));
  });

  it("renders one hidden swatch per party", () => {
    const { container } = render(
      <SeatLegend parties={seatParties(fixtureCongresoResults2023)} />,
    );
    expect(container.querySelectorAll("span[aria-hidden='true']")).toHaveLength(
      3,
    );
  });
});
