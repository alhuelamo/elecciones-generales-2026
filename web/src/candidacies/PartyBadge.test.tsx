import { cleanup, render, screen } from "@testing-library/react";
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
});
