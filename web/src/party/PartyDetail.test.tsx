import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BUTTON_CLASSES } from "../design/button";
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
    maxMarks?: number;
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
      maxMarks={chamber === "senado" ? (overrides.maxMarks ?? 2) : null}
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

  it("uses the singular marks note when only one mark is allowed", () => {
    renderDetail({ chamber: "senado", maxMarks: 1 });
    expect(screen.getByText("Puedes marcar 1 candidato")).toBeInTheDocument();
  });

  it("omits facts and party links without profile", () => {
    renderDetail({ profile: null });
    expect(screen.queryByText(/Escaños en 2023/)).toBeNull();
    expect(screen.queryByRole("link", { name: "Web oficial" })).toBeNull();
    expect(screen.getByRole("link", { name: /Volver/ })).toBeInTheDocument();
  });

  it("has no GitHub edit link", () => {
    renderDetail();
    expect(screen.queryByRole("link", { name: /GitHub/ })).toBeNull();
  });

  it("puts back and party links on one non-wrapping row of shared buttons", () => {
    renderDetail();
    const back = screen.getByRole("link", { name: /Volver/ });
    const row = back.closest("ul")!;
    expect(row).toHaveClass("flex", "flex-nowrap");
    const links = row.querySelectorAll("a");
    expect(links).toHaveLength(4);
    for (const link of links) {
      expect(link).toHaveClass(...BUTTON_CLASSES.split(" "));
    }
  });

  it("labels coalitions", () => {
    renderDetail({ coalition: true, profile: null });
    expect(screen.getByText("Coalición")).toBeInTheDocument();
  });
});
