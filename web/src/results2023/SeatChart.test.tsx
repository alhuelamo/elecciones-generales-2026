import { render, screen } from "@testing-library/react";
import i18next from "i18next";
import { afterEach, describe, expect, it } from "vitest";
import type { ConstituencyResults2023 } from "../contract/types";
import {
  fixtureCongresoLargeResults2023,
  fixtureCongresoResults2023,
} from "../test/fixtures";
import { harmonizePartyColor } from "./partyColor";
import { SeatChart } from "./SeatChart";

const SENADO_NOTE =
  "En el Senado se vota a personas, no a listas: no hay porcentaje por partido";

const tenSeatSenadoResults: ConstituencyResults2023 = {
  ...fixtureCongresoResults2023,
  blankPercentage: null,
  parties: [
    {
      acronym: "PEA",
      name: "PARTIDO EJEMPLO A",
      votes: null,
      percentage: null,
      seats: 6,
      color: "#d6402b",
    },
    {
      acronym: "PEB",
      name: "PARTIDO EJEMPLO B",
      votes: null,
      percentage: null,
      seats: 4,
      color: "#1d84ce",
    },
  ],
};

describe("SeatChart", () => {
  afterEach(() => i18next.changeLanguage("es"));

  it("draws a hemicycle with one circle per seat from 10 seats", () => {
    const { container } = render(
      <SeatChart
        chamber="congreso"
        results={fixtureCongresoLargeResults2023}
      />,
    );
    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(container.querySelectorAll("circle")).toHaveLength(12);
  });

  it("makes the hemicycle responsive", () => {
    render(
      <SeatChart
        chamber="congreso"
        results={fixtureCongresoLargeResults2023}
      />,
    );
    const svg = screen.getByRole("img");
    expect(svg).toHaveAttribute("viewBox", "-1.1 -1.1 2.2 1.2");
    expect(svg).toHaveClass("w-full", "max-w-72", "mx-auto");
  });

  it("describes the hemicycle with the legend text", () => {
    render(
      <SeatChart
        chamber="congreso"
        results={fixtureCongresoLargeResults2023}
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "PEA 6, PEB 4, CEC-D 2",
    );
  });

  it("gives the leftmost seat to the largest party", () => {
    const { container } = render(
      <SeatChart
        chamber="congreso"
        results={fixtureCongresoLargeResults2023}
      />,
    );
    expect(container.querySelector("circle")).toHaveAttribute(
      "fill",
      harmonizePartyColor("#d6402b"),
    );
  });

  it("draws seats without outlines", () => {
    const { container } = render(
      <SeatChart
        chamber="congreso"
        results={fixtureCongresoLargeResults2023}
      />,
    );
    expect(container.querySelector("circle")).not.toHaveAttribute("stroke");
  });

  it("draws small dots below 10 seats", () => {
    const { container } = render(
      <SeatChart chamber="congreso" results={fixtureCongresoResults2023} />,
    );
    expect(container.querySelector("ul")).toHaveClass("gap-1");
    expect(container.querySelector("ul li")).toHaveClass("size-2.5");
  });

  it("uses dots below 10 seats using the 2023 total", () => {
    const { container } = render(
      <SeatChart chamber="congreso" results={fixtureCongresoResults2023} />,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelectorAll("li")).toHaveLength(8);
  });

  it("uses dots for the Senado even with 10 seats", () => {
    const { container } = render(
      <SeatChart chamber="senado" results={tenSeatSenadoResults} />,
    );
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelectorAll("li")).toHaveLength(10);
  });

  it("shows the legend", () => {
    render(
      <SeatChart chamber="congreso" results={fixtureCongresoResults2023} />,
    );
    expect(screen.getByTestId("seat-legend")).toHaveTextContent(
      "PEA 4PEB 2CEC-D 2",
    );
  });

  it("shows the note only in the Senado", () => {
    const { rerender } = render(
      <SeatChart chamber="senado" results={tenSeatSenadoResults} />,
    );
    expect(screen.getByText(SENADO_NOTE)).toBeInTheDocument();
    rerender(
      <SeatChart chamber="congreso" results={fixtureCongresoResults2023} />,
    );
    expect(screen.queryByText(SENADO_NOTE)).not.toBeInTheDocument();
  });

  it("translates the note to catalan", async () => {
    await i18next.changeLanguage("ca");
    render(<SeatChart chamber="senado" results={tenSeatSenadoResults} />);
    expect(
      screen.getByText(
        "Al Senat es vota a persones, no a llistes: no hi ha percentatge per partit",
      ),
    ).toBeInTheDocument();
  });
});
