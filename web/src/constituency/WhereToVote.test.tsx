import { render, screen } from "@testing-library/react";
import i18next from "i18next";
import { afterEach, describe, expect, it } from "vitest";
import { SOURCE_URLS } from "../config";
import { WhereToVote } from "./WhereToVote";

describe("WhereToVote", () => {
  afterEach(async () => {
    await i18next.changeLanguage("es");
  });

  it("links to the official polling station lookup", () => {
    render(<WhereToVote />);
    expect(
      screen.getByRole("link", { name: /mesa y local electoral/ }),
    ).toHaveAttribute("href", SOURCE_URLS.pollingStationLookup);
  });

  it("is shown in catalan only", async () => {
    await i18next.changeLanguage("ca");
    render(<WhereToVote />);
    expect(screen.getByText(/on et toca votar/)).toBeVisible();
    expect(screen.queryByText(/dónde/)).toBeNull();
  });
});
