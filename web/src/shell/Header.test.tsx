import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

function renderHeader(onLanguageChange = vi.fn()) {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  render(<Header language="es" onLanguageChange={onLanguageChange} />);
  return onLanguageChange;
}

describe("Header", () => {
  it("is a sticky 56px banner with a non-wrapping row", () => {
    renderHeader();
    const banner = screen.getByRole("banner");
    expect(banner).toHaveClass("sticky", "top-0", "h-14");
    expect(banner.firstElementChild?.firstElementChild).toHaveClass(
      "flex-nowrap",
    );
  });

  it("draws its rule on the content column, not edge to edge", () => {
    renderHeader();
    const banner = screen.getByRole("banner");
    expect(banner).not.toHaveClass("border-b");
    expect(banner.firstElementChild).toHaveClass("max-w-3xl");
    expect(banner.firstElementChild?.firstElementChild).toHaveClass("border-b");
  });

  it("links the wordmark home with the full title as accessible name", () => {
    renderHeader();
    const link = screen.getByRole("link", {
      name: "Elecciones Generales 2026",
    });
    expect(link).toHaveAttribute("href", "#/es");
    expect(link.querySelector("[aria-hidden='true']")).toHaveClass(
      "font-display",
    );
    expect(link.querySelector(".text-accent")).toHaveTextContent("·");
    expect(link.querySelector(".sr-only")).toHaveClass("sm:not-sr-only");
  });

  it("no longer links to the about page", () => {
    renderHeader();
    expect(screen.queryByRole("link", { name: "Acerca de" })).toBeNull();
  });

  it("renders the language control as an accessible group", () => {
    renderHeader();
    const group = screen.getByRole("group", { name: "Idioma" });
    const spanish = within(group).getByRole("button", { name: "es" });
    const catalan = within(group).getByRole("button", { name: "ca" });
    expect(spanish).toHaveAttribute("aria-pressed", "true");
    expect(catalan).toHaveAttribute("aria-pressed", "false");
    expect(spanish).toHaveClass(
      "min-h-11",
      "min-w-11",
      "aria-pressed:bg-accent",
      "aria-pressed:text-paper",
    );
    expect(catalan).toHaveClass("min-h-11", "min-w-11", "uppercase");
  });

  it("notifies language changes", async () => {
    const onLanguageChange = renderHeader();
    await userEvent.click(screen.getByRole("button", { name: "ca" }));
    expect(onLanguageChange).toHaveBeenCalledWith("ca");
  });
});
