import { render, screen } from "@testing-library/react";
import i18next from "i18next";
import { afterEach, describe, expect, it } from "vitest";
import { SOURCE_URLS } from "../config";
import type { ConstituencyBallot } from "../contract/types";
import {
  fixtureCongresoBarcelona,
  fixtureCongresoResults2023,
  fixtureSenadoCombinedResults2023,
  fixtureSenadoMallorca,
  fixtureSenadoResults2023,
} from "../test/fixtures";
import { Results2023Block } from "./Results2023Block";

const congresoBallot: ConstituencyBallot = {
  ...fixtureCongresoBarcelona,
  constituencyResults2023: fixtureCongresoResults2023,
};

function renderBlock(
  ballot: ConstituencyBallot,
  constituencyName = "Barcelona",
) {
  return render(
    <Results2023Block ballot={ballot} constituencyName={constituencyName} />,
  );
}

describe("Results2023Block", () => {
  afterEach(() => i18next.changeLanguage("es"));

  it("renders the heading with the constituency name", () => {
    renderBlock(congresoBallot);
    expect(
      screen.getByRole("heading", { name: "Resultados de 2023 en Barcelona" }),
    ).toBeInTheDocument();
  });

  it("renders turnout and votes before the source link", () => {
    renderBlock(congresoBallot);
    const link = screen.getByRole("link", {
      name: "Fuente: Ministerio del Interior",
    });
    expect(link.parentElement).toHaveTextContent(
      "Participación: 70,4 % · 3.712.540 votos · Fuente: Ministerio del Interior",
    );
  });

  it("links the source through ExternalLink", () => {
    renderBlock(congresoBallot);
    const link = screen.getByRole("link", {
      name: "Fuente: Ministerio del Interior",
    });
    expect(link).toHaveAttribute("href", SOURCE_URLS.interior);
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("renders nothing without 2023 results", () => {
    const { container } = renderBlock(fixtureCongresoBarcelona);
    expect(container).toBeEmptyDOMElement();
  });

  it("uses the combined district name and shows its caption", () => {
    renderBlock(
      {
        ...fixtureSenadoMallorca,
        constituencyResults2023: fixtureSenadoCombinedResults2023,
      },
      "Eivissa",
    );
    expect(
      screen.getByRole("heading", {
        name: "Resultados de 2023 en Eivissa-Formentera",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/formaban una sola circunscripción al Senado/),
    ).toBeInTheDocument();
  });

  it("omits the combined caption otherwise", () => {
    renderBlock(congresoBallot);
    expect(screen.queryByText(/formaban una sola/)).not.toBeInTheDocument();
  });

  it("shows the vote share list for Congreso", () => {
    renderBlock(congresoBallot);
    expect(
      screen.getByRole("list", { name: "Porcentaje sobre votos válidos" }),
    ).toBeInTheDocument();
  });

  it("omits the vote share list for Senado", () => {
    renderBlock({
      ...fixtureSenadoMallorca,
      constituencyResults2023: fixtureSenadoResults2023,
    });
    expect(
      screen.queryByRole("list", { name: "Porcentaje sobre votos válidos" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/se vota a personas/)).toBeInTheDocument();
  });

  it("renders the Catalan heading", async () => {
    await i18next.changeLanguage("ca");
    renderBlock(congresoBallot);
    expect(
      screen.getByRole("heading", { name: "Resultats de 2023 a Barcelona" }),
    ).toBeInTheDocument();
  });
});
