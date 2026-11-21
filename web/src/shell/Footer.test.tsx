import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SOURCE_URLS } from "../config";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("shows the neutrality notice", () => {
    render(<Footer language="es" />);
    expect(
      screen.getByText(
        /Web no oficial e independiente, sin afiliación con ningún partido ni institución/,
      ),
    ).toBeInTheDocument();
  });

  it.each([
    ["BOE", SOURCE_URLS.boeCandidacies],
    ["INE", SOURCE_URLS.ine],
    ["Interior", SOURCE_URLS.interior],
  ])("links %s to its source", (name, url) => {
    render(<Footer language="es" />);
    expect(screen.getByRole("link", { name })).toHaveAttribute("href", url);
  });

  it("links to the about page in the current language", () => {
    render(<Footer language="es" />);
    expect(screen.getByRole("link", { name: "Acerca de" })).toHaveAttribute(
      "href",
      "#/es/about",
    );
  });
});
