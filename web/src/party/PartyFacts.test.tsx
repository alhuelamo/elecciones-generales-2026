import { render, screen } from "@testing-library/react";
import i18next from "i18next";
import { afterEach, describe, expect, it } from "vitest";
import { fixtureCatalog } from "../test/fixtures";
import { PartyFacts } from "./PartyFacts";

const fullProfile = fixtureCatalog.parties.pea;

describe("PartyFacts", () => {
  afterEach(async () => {
    await i18next.changeLanguage("es");
  });

  it("renders leader, founded and 2023 seats", () => {
    render(<PartyFacts profile={fullProfile} />);
    expect(screen.getByText("Candidata Ejemplo A1")).toBeInTheDocument();
    expect(screen.getByText("1979")).toBeInTheDocument();
    expect(screen.getByText(/Escaños en 2023/)).toBeInTheDocument();
    expect(screen.getByText(/Congreso 12/)).toBeInTheDocument();
    expect(screen.getByText(/Senado 2/)).toBeInTheDocument();
  });

  it("skips missing facts", () => {
    render(<PartyFacts profile={fixtureCatalog.parties.peb} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByText(/Escaños en 2023/)).toBeNull();
  });
});
