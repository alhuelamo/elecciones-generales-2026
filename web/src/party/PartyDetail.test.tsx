import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PARTIES_EDIT_URL } from "../config";
import type { Chamber, PartyProfile } from "../contract/types";
import {
  buildFixtureCongresoCandidacies,
  buildFixtureSenadoCandidacies,
  fixtureCatalog,
} from "../test/fixtures";
import { PartyDetail } from "./PartyDetail";

function renderDetail(
  overrides: {
    chamber?: Chamber;
    profile?: PartyProfile | null;
    coalition?: boolean;
  } = {},
) {
  const chamber = overrides.chamber ?? "congreso";
  const candidacies =
    chamber === "congreso"
      ? buildFixtureCongresoCandidacies(3)
      : buildFixtureSenadoCandidacies(3);
  const candidacy = overrides.coalition ? candidacies[2] : candidacies[0];
  return render(
    <PartyDetail
      candidacy={candidacy}
      chamber={chamber}
      maxMarks={chamber === "senado" ? 2 : null}
      profile={
        overrides.profile === undefined
          ? fixtureCatalog.parties.pea
          : overrides.profile
      }
      backHref="#/es/08019/congreso"
    />,
  );
}

afterEach(cleanup);

describe("PartyDetail", () => {
  it("scrolls to the top on mount", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    renderDetail();
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    scrollTo.mockRestore();
  });

  it("shows facts and links before the candidate list", () => {
    renderDetail();
    const facts = screen.getByRole("link", { name: "Web oficial" });
    const candidates = screen.getByRole("list", { name: "Candidatos" });
    expect(
      facts.compareDocumentPosition(candidates) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders denomination, acronym and badge", () => {
    renderDetail();
    expect(
      screen.getByRole("heading", { level: 1, name: "PARTIDO EJEMPLO A" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("PEA").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "PEA" })).toBeInTheDocument();
  });

  it("renders the back link", () => {
    renderDetail();
    expect(screen.getByRole("link", { name: /Volver/ })).toHaveAttribute(
      "href",
      "#/es/08019/congreso",
    );
  });

  it("shows the substitutes section for congreso", () => {
    renderDetail();
    expect(
      screen.getByRole("heading", { name: "Suplentes" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Puedes marcar/)).toBeNull();
  });

  it("shows marks note and substitute names for senado", () => {
    renderDetail({ chamber: "senado" });
    expect(
      screen.getByText("Puedes marcar hasta 2 candidatos en total"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Suplente Ejemplo A1A/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Suplentes" })).toBeNull();
  });

  it("omits facts but keeps the edit link without profile", () => {
    renderDetail({ profile: null });
    expect(screen.queryByText(/Escaños en 2023/)).toBeNull();
    expect(
      screen.getByRole("link", { name: "Editar en GitHub" }),
    ).toHaveAttribute("href", PARTIES_EDIT_URL);
  });

  it("renders facts for a full profile and a safe edit link", () => {
    renderDetail();
    expect(screen.getByText(/Escaños en 2023/)).toBeInTheDocument();
    const edit = screen.getByRole("link", { name: "Editar en GitHub" });
    expect(edit).toHaveAttribute("target", "_blank");
    expect(edit).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("labels coalitions", () => {
    renderDetail({ coalition: true, profile: null });
    expect(screen.getByText("Coalición")).toBeInTheDocument();
  });
});
