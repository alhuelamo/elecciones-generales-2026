import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18next from "i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import {
  buildFixtureBallot,
  buildFixtureCongresoCandidacies,
  fixtureCatalog,
  fixtureCongresoBarcelona,
  fixtureIndex,
  fixtureSenadoMallorca,
} from "./test/fixtures";
import type { MunicipalityIndex } from "./contract/types";

vi.mock("./data/loaders", () => ({
  loadMunicipalityIndex: vi.fn(),
  loadBallot: vi.fn(),
  loadPartyCatalog: vi.fn(),
}));

const BASE = import.meta.env.BASE_URL;

const loaders = await import("./data/loaders");

function stubNavigatorLanguages(languages: string[]) {
  vi.spyOn(navigator, "languages", "get").mockReturnValue(languages);
}

function mockData(index: MunicipalityIndex = fixtureIndex) {
  vi.mocked(loaders.loadMunicipalityIndex).mockResolvedValue(index);
  vi.mocked(loaders.loadPartyCatalog).mockResolvedValue(fixtureCatalog);
  vi.mocked(loaders.loadBallot).mockImplementation(async (chamber, id) =>
    chamber === "senado"
      ? fixtureSenadoMallorca
      : id === "08"
        ? fixtureCongresoBarcelona
        : buildFixtureBallot(chamber, id, buildFixtureCongresoCandidacies(1)),
  );
}

async function openAt(hash: string, language = "es") {
  window.history.replaceState(null, "", `${BASE}${language}/${hash}`);
  render(<App />);
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-21T12:00:00+01:00"));
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  await i18next.changeLanguage("es");
  stubNavigatorLanguages(["es-ES"]);
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  mockData();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("redirects empty hash to detected language", async () => {
    stubNavigatorLanguages(["ca-ES"]);
    window.history.replaceState(null, "", BASE);
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe(`${BASE}ca/`));
  });

  it("stored language beats navigator", async () => {
    localStorage.setItem("eg26.lang", "es");
    stubNavigatorLanguages(["ca-ES"]);
    window.history.replaceState(null, "", BASE);
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe(`${BASE}es/`));
  });

  it("focuses the municipality search on the home view", async () => {
    await openAt("#/");
    expect(await screen.findByRole("combobox")).toHaveFocus();
  });

  it("focuses the search again when navigating back to home", async () => {
    await openAt("#/08019");
    await screen.findByText(/Se eligen 32 diputados/);
    window.location.hash = "#/";
    expect(await screen.findByRole("combobox")).toHaveFocus();
  });

  it("renders Barcelona Congreso ballot", async () => {
    await openAt("#/08019");
    expect(await screen.findByText(/Se eligen 32 diputados/)).toBeVisible();
  });

  it("renders Mallorca Senado with two marks", async () => {
    await openAt("#/07040/senado", "ca");
    expect(await screen.findByText(/pots marcar-ne fins a 2/)).toBeVisible();
  });

  it("renders party detail from slug", async () => {
    await openAt("#/08019/congreso/pea");
    const denomination = fixtureCongresoBarcelona.candidacies.find(
      ({ slug }) => slug === "pea",
    )!.denomination;
    expect(
      await screen.findByRole("heading", { name: denomination }),
    ).toBeVisible();
  });

  it("unknown municipality falls back home with notice", async () => {
    await openAt("#/99999");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No encontramos ese municipio",
    );
    expect(window.location.hash).toBe("#/");
    expect(
      screen.getByRole("heading", { name: "¿Qué hay en tu papeleta?" }),
    ).toBeVisible();
  });

  it("unknown party slug falls back to ballot with notice", async () => {
    await openAt("#/08019/congreso/no-existe");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No encontramos esa candidatura",
    );
    expect(window.location.hash).toBe("#/08019/congreso");
    expect(screen.getByText(/Se eligen 32 diputados/)).toBeVisible();
  });

  it.each([
    ["eu", "Zer dago zure boto-txartelean?"],
    ["gl", "Que hai na túa papeleta?"],
  ])("renders the home heading in %s", async (language, heading) => {
    await openAt("#/", language);
    expect(await screen.findByRole("heading", { name: heading })).toBeVisible();
  });

  it("renders about page", async () => {
    await openAt("#/about");
    expect(
      await screen.findByRole("heading", { name: "Acerca de esta web" }),
    ).toBeVisible();
  });

  it.each([
    ["Català", "ca"],
    ["Galego", "gl"],
  ])("language menu keeps route and persists (%s)", async (name, code) => {
    await openAt("#/08019/senado");
    await screen.findByText(/Se eligen/);
    await userEvent.click(
      screen.getByRole("button", { name: "Idioma: Castellano" }),
    );
    await userEvent.click(screen.getByRole("menuitem", { name }));
    await waitFor(() =>
      expect(window.location.pathname).toBe(`${BASE}${code}/`),
    );
    expect(window.location.hash).toBe("#/08019/senado");
    expect(localStorage.getItem("eg26.lang")).toBe(code);
    expect(document.documentElement.lang).toBe(code);
  });

  it.each([
    ["", "eu"],
    ["es/", "ca"],
  ])("migrates a legacy link opened from %s", async (path, language) => {
    window.history.replaceState(
      null,
      "",
      `${BASE}${path}#/${language}/08019/senado`,
    );
    render(<App />);
    await waitFor(() =>
      expect(window.location.pathname).toBe(`${BASE}${language}/`),
    );
    expect(window.location.hash).toBe("#/08019/senado");
  });

  it("titles the tab in spanish on home", async () => {
    await openAt("#/");
    await waitFor(() =>
      expect(document.title).toBe("Elecciones Generales 2026"),
    );
  });

  it("titles the tab with municipality and chamber in the current language", async () => {
    await openAt("#/08101/senado", "ca");
    await waitFor(() =>
      expect(document.title).toBe(
        "L'Hospitalet de Llobregat · Senat · Eleccions Generals 2026",
      ),
    );
  });

  it("titles the tab with the party on detail", async () => {
    await openAt("#/08019/congreso/pea");
    await waitFor(() =>
      expect(document.title).toBe(
        "PEA · Barcelona · Congreso · Elecciones Generales 2026",
      ),
    );
  });

  it("titles the tab on the about page", async () => {
    await openAt("#/about");
    await waitFor(() =>
      expect(document.title).toBe(
        "Acerca de esta web · Elecciones Generales 2026",
      ),
    );
  });

  it("shows demo banner for fixture dataset", async () => {
    await openAt("#/");
    expect(await screen.findByText(/Datos de demostración/)).toBeVisible();
  });

  it("hides demo banner for real dataset", async () => {
    mockData({ ...fixtureIndex, dataset: "boe-2026" });
    await openAt("#/");
    await screen.findByText("¿Qué hay en tu papeleta?");
    expect(screen.queryByText(/Datos de demostración/)).toBeNull();
  });

  it("search selection navigates to congreso ballot", async () => {
    await openAt("#/");
    await userEvent.type(await screen.findByRole("combobox"), "barcelona");
    await userEvent.click(
      await screen.findByRole("option", { name: /Barcelona/ }),
    );
    await waitFor(() => expect(window.location.hash).toBe("#/08019/congreso"));
  });

  it("links about from the footer", async () => {
    await openAt("#/", "ca");
    await screen.findByText("Què hi ha a la teva papereta?");
    expect(
      within(screen.getByRole("contentinfo")).getByRole("link", {
        name: "Sobre aquesta web",
      }),
    ).toHaveAttribute("href", "#/about");
  });
});
