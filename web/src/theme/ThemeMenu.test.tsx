import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeMenu } from "./ThemeMenu";

type Listener = () => void;

function mockMatchMedia(initiallyDark: boolean) {
  const listeners = new Set<Listener>();
  const mediaQuery = {
    matches: initiallyDark,
    addEventListener: (_: string, listener: Listener) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: Listener) =>
      listeners.delete(listener),
  };
  vi.stubGlobal("matchMedia", () => mediaQuery);
  return {
    change: (matches: boolean) => {
      mediaQuery.matches = matches;
      act(() => listeners.forEach((listener) => listener()));
    },
  };
}

describe("ThemeMenu", () => {
  afterEach(cleanup);

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("names the button after the current choice", () => {
    mockMatchMedia(false);
    render(<ThemeMenu />);
    expect(
      screen.getByRole("button", { name: "Tema: Sistema" }),
    ).toBeInTheDocument();
  });

  it("lists the three choices", async () => {
    mockMatchMedia(false);
    render(<ThemeMenu />);
    await userEvent.click(screen.getByRole("button"));
    const labels = screen
      .getAllByRole("menuitem")
      .map((item) => item.textContent?.replace("✓", ""));
    expect(labels).toEqual(["Sistema", "Claro", "Oscuro"]);
  });

  it("applies and persists the chosen theme", async () => {
    mockMatchMedia(false);
    render(<ThemeMenu />);
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByRole("menuitem", { name: /Oscuro/ }));
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem("eg26.theme")).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Tema: Oscuro" }),
    ).toBeInTheDocument();
  });

  it("follows system changes while in system mode", () => {
    const media = mockMatchMedia(false);
    render(<ThemeMenu />);
    media.change(true);
    expect(document.documentElement).toHaveClass("dark");
    media.change(false);
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("ignores system changes once explicit", async () => {
    const media = mockMatchMedia(false);
    render(<ThemeMenu />);
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByRole("menuitem", { name: /Claro/ }));
    media.change(true);
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("is operable by keyboard and returns focus to the button", async () => {
    mockMatchMedia(false);
    render(<ThemeMenu />);
    const button = screen.getByRole("button");
    button.focus();
    await userEvent.keyboard("{Enter}{ArrowDown}{Enter}");
    expect(localStorage.getItem("eg26.theme")).toBe("light");
    await waitFor(() => expect(button).toHaveFocus());
  });

  it("marks the current choice with a hidden check glyph", async () => {
    mockMatchMedia(false);
    render(<ThemeMenu />);
    await userEvent.click(screen.getByRole("button"));
    const check = screen.getByText("✓");
    expect(check).toHaveAttribute("aria-hidden", "true");
    expect(check.closest("[role='menuitem']")).toHaveTextContent("Sistema");
  });
});
