import { render, screen } from "@testing-library/react";
import i18next from "i18next";
import { afterEach, describe, expect, it } from "vitest";
import type { PartyProfile } from "../contract/types";
import { BUTTON_CLASSES } from "../design/button";
import { fixtureCatalog } from "../test/fixtures";
import { PartyLinks } from "./PartyLinks";

const fullProfile = fixtureCatalog.parties.pea;

function renderLinks(profile: PartyProfile = fullProfile) {
  render(
    <ul>
      <PartyLinks profile={profile} />
    </ul>,
  );
}

describe("PartyLinks", () => {
  afterEach(async () => {
    await i18next.changeLanguage("es");
  });

  it("styles every link as a shared button", () => {
    renderLinks();
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveClass(...BUTTON_CLASSES.split(" "));
    }
  });

  it("renders nothing for a profile without links", () => {
    renderLinks(fixtureCatalog.parties.peb);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders external links opening safely", () => {
    renderLinks();
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
    renderLinks();
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
    renderLinks(profile);
    expect(
      screen.getByRole("link", { name: /Wikipedia|Viquipèdia/ }),
    ).toHaveAttribute("href", "https://es.wikipedia.org/wiki/X");
  });
});
