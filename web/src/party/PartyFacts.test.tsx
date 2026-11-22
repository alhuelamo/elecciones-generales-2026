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
    render(<PartyFacts profile={fullProfile} localHead={null} />);
    expect(screen.getByText("Candidata Ejemplo A1")).toBeInTheDocument();
    expect(screen.getByText("1979")).toBeInTheDocument();
    expect(screen.getByText(/Escaños en 2023/)).toBeInTheDocument();
    expect(screen.getByText(/Congreso 12/)).toBeInTheDocument();
    expect(screen.getByText(/Senado 2/)).toBeInTheDocument();
  });

  it("labels the national leader as Líder", () => {
    render(<PartyFacts profile={fullProfile} localHead={null} />);
    expect(screen.getByText("Líder")).toBeInTheDocument();
    expect(screen.queryByText("Cabeza de lista")).toBeNull();
  });

  it("renders the local head of list after the national leader", () => {
    render(
      <PartyFacts
        profile={fullProfile}
        localHead={{ constituencyName: "Barcelona", name: "Local Uno" }}
      />,
    );
    const label = screen.getByText("Encabeza la lista en Barcelona");
    expect(label.nextElementSibling).toHaveTextContent("Local Uno");
    expect(
      screen.getByText("Líder").compareDocumentPosition(label) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders the local head without a profile", () => {
    render(
      <PartyFacts
        profile={null}
        localHead={{ constituencyName: "Barcelona", name: "Local Uno" }}
      />,
    );
    expect(screen.getByText("Local Uno")).toBeInTheDocument();
  });

  it("renders nothing without profile or local head", () => {
    const { container } = render(
      <PartyFacts profile={null} localHead={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ["ca", "Líder", "Encapçala la llista a Barcelona"],
    ["gl", "Líder", "Encabeza a lista en Barcelona"],
    ["eu", "Burua", "Zerrendaburua (Barcelona)"],
  ])("translates labels in %s", async (language, leader, local) => {
    await i18next.changeLanguage(language);
    render(
      <PartyFacts
        profile={fullProfile}
        localHead={{ constituencyName: "Barcelona", name: "Local Uno" }}
      />,
    );
    expect(screen.getByText(leader)).toBeInTheDocument();
    expect(screen.getByText(local)).toBeInTheDocument();
  });

  it("skips missing facts", () => {
    render(
      <PartyFacts profile={fixtureCatalog.parties.peb} localHead={null} />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByText(/Escaños en 2023/)).toBeNull();
  });
});
