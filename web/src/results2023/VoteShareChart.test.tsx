import { render, screen, within } from "@testing-library/react";
import i18next from "i18next";
import { afterEach, describe, expect, it } from "vitest";
import type { ConstituencyResults2023 } from "../contract/types";
import { fixtureCongresoResults2023 } from "../test/fixtures";
import { harmonizePartyColor } from "./partyColor";
import { VoteShareChart } from "./VoteShareChart";
import { resolveResultsColors } from "./constituencyColors";

function withPartyColor(color: string | null): ConstituencyResults2023 {
  const [first, ...rest] = fixtureCongresoResults2023.parties;
  return {
    ...fixtureCongresoResults2023,
    parties: [{ ...first, color }, ...rest],
  };
}

function firstBar(): HTMLElement {
  const [firstRow] = screen.getAllByRole("listitem");
  return firstRow.querySelector("[aria-hidden='true']") as HTMLElement;
}

describe("VoteShareChart", () => {
  afterEach(() => i18next.changeLanguage("es"));

  it("lists parties, then others, then blank", () => {
    render(
      <VoteShareChart
        results={fixtureCongresoResults2023}
        colors={resolveResultsColors(fixtureCongresoResults2023)}
      />,
    );
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(5);
    expect(rows[0]).toHaveTextContent("PEA");
    expect(rows[3]).toHaveTextContent("Otros");
    expect(rows[4]).toHaveTextContent("En blanco");
  });

  it("formats percentages with one decimal", () => {
    render(
      <VoteShareChart
        results={fixtureCongresoResults2023}
        colors={resolveResultsColors(fixtureCongresoResults2023)}
      />,
    );
    const [firstRow] = screen.getAllByRole("listitem");
    expect(within(firstRow).getByText("40,0 %")).toBeInTheDocument();
  });

  it("includes the full party name for assistive technology", () => {
    render(
      <VoteShareChart
        results={fixtureCongresoResults2023}
        colors={resolveResultsColors(fixtureCongresoResults2023)}
      />,
    );
    expect(screen.getByText("PARTIDO EJEMPLO A")).toHaveClass("sr-only");
  });

  it("shows the threshold label once", () => {
    render(
      <VoteShareChart
        results={fixtureCongresoResults2023}
        colors={resolveResultsColors(fixtureCongresoResults2023)}
      />,
    );
    expect(screen.getAllByText("barrera del 3 %")).toHaveLength(1);
  });

  it("fills the bar with the party colour", () => {
    render(
      <VoteShareChart
        results={fixtureCongresoResults2023}
        colors={resolveResultsColors(fixtureCongresoResults2023)}
      />,
    );
    expect(firstBar()).toHaveStyle({
      backgroundColor: harmonizePartyColor("#d6402b"),
    });
    expect(firstBar()).toHaveStyle({ width: "100%" });
  });

  it("falls back to grey when the colour is null", () => {
    render(
      <VoteShareChart
        results={withPartyColor(null)}
        colors={resolveResultsColors(withPartyColor(null))}
      />,
    );
    expect(firstBar()).toHaveStyle({ backgroundColor: "#8c877c" });
  });

  it("draws thin rounded bars without outlines", () => {
    render(
      <VoteShareChart
        results={withPartyColor("#f0f0f0")}
        colors={resolveResultsColors(withPartyColor("#f0f0f0"))}
      />,
    );
    expect(firstBar()).toHaveClass("h-2.5", "rounded-full");
    expect(firstBar()).not.toHaveClass("outline");
  });

  it("translates labels to catalan", async () => {
    await i18next.changeLanguage("ca");
    render(
      <VoteShareChart
        results={fixtureCongresoResults2023}
        colors={resolveResultsColors(fixtureCongresoResults2023)}
      />,
    );
    expect(screen.getAllByRole("listitem")[3]).toHaveTextContent("Altres");
    expect(screen.getAllByRole("listitem")[4]).toHaveTextContent("En blanc");
  });
});
