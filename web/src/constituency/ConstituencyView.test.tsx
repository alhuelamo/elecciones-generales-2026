import { render, screen } from "@testing-library/react";
import i18next from "i18next";
import { afterEach, describe, expect, it } from "vitest";
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

function renderSenado() {
  return render(
    <ConstituencyView
      municipality={palma}
      constituency={mallorca}
      ballot={fixtureSenadoMallorca}
      partyCatalog={fixtureCatalog}
      chamberHref={(chamber) => `#/es/07040/${chamber}`}
      candidacyHref={({ slug }) => `#/es/07040/senado/${slug}`}
    />,
  );
}

describe("ConstituencyView", () => {
  afterEach(async () => {
    await i18next.changeLanguage("es");
  });

  it("shows municipality and localized constituency name in catalan", async () => {
    await i18next.changeLanguage("ca");
    render(
      <ConstituencyView
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
});
