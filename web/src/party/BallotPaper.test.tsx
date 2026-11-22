import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildFixtureCongresoCandidacies,
  buildFixtureSenadoCandidacies,
  fixtureCatalog,
} from "../test/fixtures";
import { BallotPaper } from "./BallotPaper";

const logo = fixtureCatalog.parties.pea.logo;

afterEach(cleanup);

describe("BallotPaper", () => {
  it("is a figure captioned as a non-valid representation", () => {
    const [candidacy] = buildFixtureCongresoCandidacies(3);
    render(
      <BallotPaper
        candidacy={candidacy}
        chamber="congreso"
        maxMarks={0}
        logo={logo}
      />,
    );
    expect(
      screen.getByRole("figure", {
        name: "Representación orientativa, no válida para votar",
      }),
    ).toBeInTheDocument();
  });

  it("renders congreso on raised paper with logo, denomination and lists", () => {
    const [candidacy] = buildFixtureCongresoCandidacies(3);
    render(
      <BallotPaper
        candidacy={candidacy}
        chamber="congreso"
        maxMarks={0}
        logo={logo}
      />,
    );
    expect(screen.getByRole("figure")).toHaveClass("bg-paper-raised");
    expect(screen.getAllByRole("img", { name: "PEA" })).toHaveLength(1);
    expect(screen.getByText("PARTIDO EJEMPLO A")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Candidatos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Suplentes" }),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("checkbox")).toEqual([]);
    expect(screen.queryAllByTestId("ballot-checkbox")).toEqual([]);
  });

  it("renders senado on kraft with decorative checkboxes and the marks note", () => {
    const [candidacy] = buildFixtureSenadoCandidacies(3);
    const { container } = render(
      <BallotPaper
        candidacy={candidacy}
        chamber="senado"
        maxMarks={2}
        logo={logo}
      />,
    );
    expect(screen.getByRole("figure")).toHaveClass("bg-kraft");
    const boxes = container.querySelectorAll(
      'span[aria-hidden="true"][data-testid="ballot-checkbox"]',
    );
    expect(boxes).toHaveLength(candidacy.candidates.length);
    expect(screen.queryAllByRole("checkbox")).toEqual([]);
    expect(
      screen.getByText("Puedes marcar hasta 2 candidatos en total"),
    ).toBeInTheDocument();
  });
});
