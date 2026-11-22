import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { fixtureCatalog } from "../test/fixtures";
import { PartyBadge } from "./PartyBadge";

afterEach(cleanup);

describe("PartyBadge", () => {
  it("renders the logo image when available", () => {
    const logo = { ...fixtureCatalog.parties.pea.logo!, path: "logos/x.svg" };
    render(<PartyBadge acronym="PEA" logo={logo} size="small" />);
    const image = screen.getByRole("img", { name: "PEA" });
    expect(image.getAttribute("src")).toMatch(/logos\/x\.svg$/);
  });

  it("renders a generated text badge without logo", () => {
    render(<PartyBadge acronym="PEB" logo={null} size="large" />);
    expect(screen.getByText("PEB")).toHaveAttribute("title", "PEB");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders a monochrome ink-on-paper badge without inline colors", () => {
    render(<PartyBadge acronym="PEB" logo={null} size="small" />);
    const badge = screen.getByText("PEB");
    expect(badge).toHaveClass("bg-paper", "text-ink", "ring-1", "ring-ink");
    expect(badge).not.toHaveAttribute("style");
  });

  it("falls back to the generated badge when the logo fails to load", () => {
    const logo = { ...fixtureCatalog.parties.pea.logo!, path: "logos/x.svg" };
    render(<PartyBadge acronym="PEA" logo={logo} size="small" />);
    fireEvent.error(screen.getByRole("img", { name: "PEA" }));
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("PEA")).toHaveAttribute("title", "PEA");
  });

  it("keeps the full long acronym in the title", () => {
    render(
      <PartyBadge
        acronym="COMPROMIS-EUPV-PODEM-ERPV"
        logo={null}
        size="small"
      />,
    );
    expect(screen.getByText("COMPROMIS-EUPV-PODEM-ERPV")).toHaveAttribute(
      "title",
      "COMPROMIS-EUPV-PODEM-ERPV",
    );
  });

  it("uses denomination initials when the acronym is empty", () => {
    render(
      <PartyBadge
        acronym=""
        denomination="Partido de los Ejemplos Unidos"
        logo={null}
        size="small"
      />,
    );
    const badge = screen.getByText("PEU");
    expect(badge).toHaveAttribute("title", "Partido de los Ejemplos Unidos");
  });
});
