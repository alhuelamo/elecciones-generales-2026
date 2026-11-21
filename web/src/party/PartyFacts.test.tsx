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

  it("renders external links opening safely", () => {
    render(<PartyFacts profile={fullProfile} />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(screen.getByRole("link", { name: "Web oficial" })).toHaveAttribute(
      "href",
      fullProfile.website,
    );
    expect(screen.getByRole("link", { name: "Programa" })).toHaveAttribute(
      "href",
      fullProfile.programmeUrl,
    );
  });

  it("links the wikipedia page of the current language", async () => {
    await i18next.changeLanguage("ca");
    render(<PartyFacts profile={fullProfile} />);
    expect(
      screen.getByRole("link", { name: /Wikipedia|Viquipèdia/ }),
    ).toHaveAttribute("href", fullProfile.wikipedia.ca);
  });

  it("falls back to the other language wikipedia", async () => {
    await i18next.changeLanguage("ca");
    const profile = {
      ...fullProfile,
      wikipedia: { es: "https://es.wikipedia.org/wiki/X", ca: null },
    };
    render(<PartyFacts profile={profile} />);
    expect(
      screen.getByRole("link", { name: /Wikipedia|Viquipèdia/ }),
    ).toHaveAttribute("href", "https://es.wikipedia.org/wiki/X");
  });

  it("skips missing facts", () => {
    render(<PartyFacts profile={fixtureCatalog.parties.peb} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByText(/Escaños en 2023/)).toBeNull();
  });
});
