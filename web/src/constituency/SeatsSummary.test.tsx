import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SeatsSummary } from "./SeatsSummary";

describe("SeatsSummary", () => {
  it("states the congreso seats", () => {
    render(<SeatsSummary chamber="congreso" seats={32} maxMarks={null} />);
    expect(screen.getByText("Se eligen 32 diputados")).toBeInTheDocument();
  });

  it("uses the singular for one seat", () => {
    render(<SeatsSummary chamber="congreso" seats={1} maxMarks={null} />);
    expect(screen.getByText("Se elige 1 diputado")).toBeInTheDocument();
  });

  it("states the senado seats and maximum marks", () => {
    render(<SeatsSummary chamber="senado" seats={3} maxMarks={2} />);
    expect(screen.getByText(/Se eligen 3 senadores/)).toHaveTextContent(
      "puedes marcar hasta 2",
    );
  });
});
