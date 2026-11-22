import { render, screen, within } from "@testing-library/react";
import i18next from "i18next";
import { afterEach, describe, expect, it } from "vitest";
import type { ConstituencyResults2023 } from "../contract/types";
import { fixtureCongresoResults2023 } from "../test/fixtures";
import { COLUMNS_CLASSES } from "./columns";
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

const oneSeatSenadoResults: ConstituencyResults2023 = {
  ...tenSeatSenadoResults,
  parties: [{ ...tenSeatSenadoResults.parties[0], seats: 1 }],
};

describe("SeatChart", () => {
  afterEach(() => i18next.changeLanguage("es"));

  it("draws one row per party with seats, largest first", () => {
    render(
      <SeatChart chamber="congreso" results={fixtureCongresoResults2023} />,
    );
    const rows = within(
      screen.getByRole("list", { name: "Escaños en 2023" }),
    ).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("PEA");
    expect(rows[0]).toHaveTextContent("4 escaños");
    expect(rows[1]).toHaveTextContent("PEB");
    expect(rows[1]).toHaveTextContent("2 escaños");
  });

  it("draws one coloured dot per seat from the 2023 total", () => {
    const { container } = render(
      <SeatChart chamber="congreso" results={fixtureCongresoResults2023} />,
    );
    const dots = container.querySelectorAll("[data-testid='seat-dot']");
    expect(dots).toHaveLength(8);
    expect(dots[0]).toHaveClass("size-2.5", "rounded-full");
    expect(dots[0]).toHaveStyle({
      backgroundColor: harmonizePartyColor("#d6402b"),
    });
    expect(dots[0].parentElement).toHaveClass("flex-wrap", "gap-1");
    expect(dots[0].parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("uses the same columns as the vote share rows", () => {
    render(
      <SeatChart chamber="congreso" results={fixtureCongresoResults2023} />,
    );
    expect(screen.getAllByRole("listitem")[0]).toHaveClass(
      ...COLUMNS_CLASSES.split(" "),
    );
  });

  it("uses the singular for one seat", () => {
    render(<SeatChart chamber="senado" results={oneSeatSenadoResults} />);
    expect(screen.getByRole("listitem")).toHaveTextContent("1 escaño");
    expect(screen.getByRole("listitem")).not.toHaveTextContent("escaños");
  });

  it("draws rows for the Senado too", () => {
    render(<SeatChart chamber="senado" results={tenSeatSenadoResults} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("6 escaños");
  });

  it("translates the unit to catalan", async () => {
    await i18next.changeLanguage("ca");
    render(<SeatChart chamber="senado" results={tenSeatSenadoResults} />);
    expect(screen.getByRole("list", { name: "Escons el 2023" })).toBeVisible();
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("6 escons");
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
