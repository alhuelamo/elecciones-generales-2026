import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18next from "i18next";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fixtureCatalog,
  fixtureCongresoBarcelona,
  fixtureIndex,
  fixtureSenadoMallorca,
} from "../test/fixtures";
import { ConstituencyView } from "./ConstituencyView";

const palma = fixtureIndex.municipalities.find(({ code }) => code === "07040")!;
const mallorca = fixtureIndex.constituencies.senado.find(
  ({ id }) => id === "07-mallorca",
)!;
const barcelona = fixtureIndex.municipalities.find(
  ({ code }) => code === "08019",
)!;
const barcelonaCongreso = fixtureIndex.constituencies.congreso.find(
  ({ id }) => id === "08",
)!;

function renderSenado(onMunicipalitySelect = vi.fn()) {
  render(
    <ConstituencyView
      index={fixtureIndex}
      onMunicipalitySelect={onMunicipalitySelect}
      municipality={palma}
      constituency={mallorca}
      ballot={fixtureSenadoMallorca}
      partyCatalog={fixtureCatalog}
      chamberHref={(chamber) => `#/es/07040/${chamber}`}
      candidacyHref={({ slug }) => `#/es/07040/senado/${slug}`}
    />,
  );
  return onMunicipalitySelect;
}

describe("ConstituencyView", () => {
  afterEach(async () => {
    await i18next.changeLanguage("es");
  });

  it("shows municipality and localized constituency name in catalan", async () => {
    await i18next.changeLanguage("ca");
    render(
      <ConstituencyView
        index={fixtureIndex}
        onMunicipalitySelect={vi.fn()}
        municipality={barcelona}
        constituency={barcelonaCongreso}
        ballot={fixtureCongresoBarcelona}
        partyCatalog={fixtureCatalog}
        chamberHref={(chamber) => `#/ca/08019/${chamber}`}
        candidacyHref={({ slug }) => `#/ca/08019/congreso/${slug}`}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Barcelona" }),
    ).toBeInTheDocument();
    expect(screen.getByText("S'escullen 32 diputats")).toBeInTheDocument();
  });

  it("omits the constituency subtitle when it repeats the municipality name", () => {
    render(
      <ConstituencyView
        index={fixtureIndex}
        onMunicipalitySelect={vi.fn()}
        municipality={barcelona}
        constituency={barcelonaCongreso}
        ballot={fixtureCongresoBarcelona}
        partyCatalog={fixtureCatalog}
        chamberHref={(chamber) => `#/es/08019/${chamber}`}
        candidacyHref={({ slug }) => `#/es/08019/congreso/${slug}`}
      />,
    );
    expect(screen.getAllByText("Barcelona")).toHaveLength(1);
  });

  it("shows the constituency name and seat summary for senado", () => {
    renderSenado();
    expect(
      screen.getByRole("heading", { level: 1, name: "Palma de Mallorca" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Mallorca")).toBeInTheDocument();
    expect(
      screen.getByText(/Se eligen 3 senadores.*hasta 2/),
    ).toBeInTheDocument();
  });

  it("renders the candidacy list with links", () => {
    renderSenado();
    expect(
      screen.getByRole("link", { name: /PARTIDO EJEMPLO A/ }),
    ).toHaveAttribute("href", "#/es/07040/senado/pea");
  });

  it("renders the chamber tabs", () => {
    renderSenado();
    expect(screen.getByRole("link", { name: "Congreso" })).toHaveAttribute(
      "href",
      "#/es/07040/congreso",
    );
  });

  it("hides the municipality search until asked to change town", () => {
    renderSenado();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Cambiar municipio" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("opens a focused search to change town", async () => {
    renderSenado();
    await userEvent.click(
      screen.getByRole("button", { name: "Cambiar municipio" }),
    );
    expect(
      screen.getByRole("combobox", { name: "Buscar municipio" }),
    ).toHaveFocus();
    expect(
      screen.getByRole("button", { name: "Cambiar municipio" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("reports the chosen municipality", async () => {
    const onMunicipalitySelect = renderSenado();
    await userEvent.click(
      screen.getByRole("button", { name: "Cambiar municipio" }),
    );
    await userEvent.type(screen.getByRole("combobox"), "madrid");
    await userEvent.click(
      await screen.findByRole("option", { name: /^Madrid/ }),
    );
    expect(onMunicipalitySelect).toHaveBeenCalledWith(
      expect.objectContaining({ code: "28079" }),
    );
  });

  it("closes the search with Escape and returns focus to the button", async () => {
    renderSenado();
    const toggle = screen.getByRole("button", { name: "Cambiar municipio" });
    await userEvent.click(toggle);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(toggle).toHaveFocus();
  });
});
