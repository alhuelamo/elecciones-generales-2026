import { cleanup, render, screen, within } from "@testing-library/react";
import i18next from "i18next";
import { afterEach, describe, expect, it } from "vitest";
import { ISSUES_URL, SOURCE_URLS } from "../config";
import { fixtureCatalog } from "../test/fixtures";
import { AboutPage } from "./AboutPage";

const GENERATED_AT = "2026-11-23T10:00:00Z";

function renderAbout(partyCatalog = fixtureCatalog) {
  return render(
    <AboutPage generatedAt={GENERATED_AT} partyCatalog={partyCatalog} />,
  );
}

function hrefs(): string[] {
  return screen.getAllByRole("link").map((link) => link.getAttribute("href")!);
}

describe("AboutPage", () => {
  afterEach(async () => {
    cleanup();
    await i18next.changeLanguage("es");
  });

  it("renders the build date in spanish", () => {
    renderAbout();
    expect(screen.getByText(/23 de noviembre de 2026/)).toBeInTheDocument();
  });

  it("renders the build date in catalan", async () => {
    await i18next.changeLanguage("ca");
    renderAbout();
    expect(screen.getByText(/23 de novembre del? 2026/)).toBeInTheDocument();
  });

  it.each([
    SOURCE_URLS.boeCandidacies,
    SOURCE_URLS.boeConvocation,
    SOURCE_URLS.ine,
    SOURCE_URLS.interior,
    SOURCE_URLS.commons,
    SOURCE_URLS.partiesYaml,
  ])("links to %s", (url) => {
    renderAbout();
    expect(hrefs()).toContain(url);
  });

  it("lists one credit row per profile with a logo", () => {
    renderAbout();
    const credits = screen.getByRole("list", { name: /logos/i });
    const rows = within(credits).getAllByRole("listitem");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("Partido Ejemplo A");
    expect(rows[0]).toHaveTextContent("CC BY-SA 4.0");
    expect(rows[0]).toHaveTextContent("Autora Ejemplo");
    expect(within(rows[0]).getByRole("link")).toHaveAttribute(
      "href",
      "https://commons.wikimedia.org/wiki/File:Ejemplo.svg",
    );
  });

  it("hides logo credits when no profile has a logo", () => {
    renderAbout({
      parties: { peb: { ...fixtureCatalog.parties.peb } },
    });
    expect(screen.queryByRole("list", { name: /logos/i })).toBeNull();
  });

  it("hides logo credits without a catalog", () => {
    render(<AboutPage generatedAt={GENERATED_AT} partyCatalog={null} />);
    expect(screen.queryByRole("list", { name: /logos/i })).toBeNull();
  });

  it("shows the disclaimer in spanish", () => {
    renderAbout();
    expect(
      screen.getByText(
        "Esta web es independiente. No está afiliada a ningún partido político, institución pública ni administración electoral. Comprueba siempre la información oficial.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the disclaimer in catalan", async () => {
    await i18next.changeLanguage("ca");
    renderAbout();
    expect(
      screen.getByText(
        "Aquest web és independent. No està afiliat a cap partit polític, institució pública ni administració electoral. Comprova sempre la informació oficial.",
      ),
    ).toBeInTheDocument();
  });

  it("links the report-an-error action to the issue tracker", () => {
    renderAbout();
    expect(
      screen.getByRole("link", { name: /informar de un error/i }),
    ).toHaveAttribute("href", ISSUES_URL);
  });

  it("mentions the MIT license", () => {
    renderAbout();
    expect(screen.getByText(/licencia MIT/i)).toBeInTheDocument();
  });
});
