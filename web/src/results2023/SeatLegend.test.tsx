import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fixtureCongresoResults2023 } from "../test/fixtures";
import { seatParties } from "./seatAllocation";
import { SeatLegend } from "./SeatLegend";

describe("SeatLegend", () => {
  it("lists acronyms and seats separated by dots", () => {
    render(<SeatLegend parties={seatParties(fixtureCongresoResults2023)} />);
    expect(screen.getByTestId("seat-legend")).toHaveTextContent(
      "PEA 4 · PEB 2 · CEC-D 2",
    );
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
