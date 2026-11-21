import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  buildFixtureCongresoCandidacies,
  buildFixtureSenadoCandidacies,
} from "../test/fixtures";
import { CandidateList } from "./CandidateList";

describe("CandidateList", () => {
  it("renders titulares in order, then a substitutes section for congreso", () => {
    const [candidacy] = buildFixtureCongresoCandidacies(3);
    render(<CandidateList candidacy={candidacy} chamber="congreso" />);
    const titulares = within(
      screen.getByRole("list", { name: "Candidatos" }),
    ).getAllByRole("listitem");
    expect(titulares.map((item) => item.textContent)).toEqual([
      "1Candidata Ejemplo A1",
      "2Candidata Ejemplo A2",
      "3Candidata Ejemplo A3",
    ]);
    expect(
      screen.getByRole("heading", { name: "Suplentes" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Suplente Ejemplo A1")).toBeInTheDocument();
  });

  it("omits the substitutes section when congreso has none", () => {
    const [candidacy] = buildFixtureCongresoCandidacies(1);
    render(
      <CandidateList
        candidacy={{ ...candidacy, substitutes: [] }}
        chamber="congreso"
      />,
    );
    expect(screen.queryByRole("heading", { name: "Suplentes" })).toBeNull();
  });

  it("shows each senado candidate with its substitute names and no section", () => {
    const [candidacy] = buildFixtureSenadoCandidacies(3);
    render(<CandidateList candidacy={candidacy} chamber="senado" />);
    expect(screen.queryByRole("heading", { name: "Suplentes" })).toBeNull();
    const first = screen.getAllByRole("listitem")[0];
    expect(first).toHaveTextContent("Candidata Ejemplo A1");
    expect(first).toHaveTextContent("Suplente Ejemplo A1A");
    expect(first).toHaveTextContent("Suplente Ejemplo A1B");
  });
});
