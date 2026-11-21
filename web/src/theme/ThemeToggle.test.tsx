import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./ThemeToggle";

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
      listeners.forEach((listener) => listener());
    },
  };
}

describe("ThemeToggle", () => {
  afterEach(cleanup);

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("cycles from system to light and stores it", () => {
    mockMatchMedia(false);
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(localStorage.getItem("eg26.theme")).toBe("light");
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Tema claro",
    );
  });

  it("applies dark when system prefers dark", () => {
    mockMatchMedia(true);
    render(<ThemeToggle />);
    expect(document.documentElement).toHaveClass("dark");
  });

  it("follows system changes while in system mode", () => {
    const media = mockMatchMedia(false);
    render(<ThemeToggle />);
    media.change(true);
    expect(document.documentElement).toHaveClass("dark");
  });

  it("ignores system changes once explicit", () => {
    const media = mockMatchMedia(false);
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    media.change(true);
    expect(document.documentElement).not.toHaveClass("dark");
  });
});
