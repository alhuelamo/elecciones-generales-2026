import { render, screen } from "@testing-library/react";
import i18next from "i18next";
import { afterEach, describe, expect, it } from "vitest";
import type { Language, PartyProfile } from "../contract/types";
import { BUTTON_CLASSES } from "../design/button";
import { fixtureCatalog } from "../test/fixtures";
import { PartyLinks } from "./PartyLinks";

const ES_URL = "https://es.wikipedia.org/wiki/X";
const CA_URL = "https://ca.wikipedia.org/wiki/X";
const GL_URL = "https://gl.wikipedia.org/wiki/X";
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

  it.each<[Language, PartyProfile["wikipedia"], string | null]>([
    ["eu", { es: ES_URL, ca: null, eu: null, gl: null }, ES_URL],
    ["gl", { es: ES_URL, ca: null, eu: null, gl: GL_URL }, GL_URL],
    ["eu", { es: null, ca: CA_URL, eu: null, gl: null }, null],
    ["ca", { es: ES_URL, ca: null, eu: null, gl: null }, ES_URL],
    ["es", { es: null, ca: CA_URL, eu: null, gl: null }, CA_URL],
  ])(
    "in %s with wikipedia %j links %s",
    async (language, wikipedia, expectedHref) => {
      await i18next.changeLanguage(language);
      renderLinks({ ...fullProfile, wikipedia });
      const link = screen.queryByRole("link", {
        name: /Wikipedia|Viquipèdia/,
      });
      if (expectedHref === null) {
        expect(link).toBeNull();
      } else {
        expect(link).toHaveAttribute("href", expectedHref);
      }
    },
  );
});
