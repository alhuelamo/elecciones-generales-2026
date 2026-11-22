import { act, render, screen } from "@testing-library/react";
import i18next from "i18next";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ElectionCountdown } from "./ElectionCountdown";

function renderAt(instant: string) {
  return render(<ElectionCountdown now={() => new Date(instant)} />);
}

describe("ElectionCountdown", () => {
  afterEach(async () => {
    vi.useRealTimers();
    await i18next.changeLanguage("es");
  });

  it("counts days in plural", () => {
    renderAt("2026-11-21T12:00:00+01:00");
    expect(screen.getByText(/Faltan/)).toHaveTextContent(
      "Faltan 8 días · domingo 29 de noviembre",
    );
  });

  it("counts a single day", () => {
    renderAt("2026-11-28T12:00:00+01:00");
    expect(screen.getByText(/Falta/)).toHaveTextContent(
      "Falta 1 día · domingo 29 de noviembre",
    );
  });

  it("renders in Catalan", async () => {
    await i18next.changeLanguage("ca");
    renderAt("2026-11-21T12:00:00+01:00");
    expect(screen.getByText(/Falten/)).toHaveTextContent(
      "Falten 8 dies · diumenge 29 de novembre",
    );
  });

  it("wraps the number in tabular-nums", () => {
    renderAt("2026-11-21T12:00:00+01:00");
    expect(screen.getByText("8")).toHaveClass("tabular-nums");
  });

  it.each([
    ["election day morning", "2026-11-29T10:00:00+01:00"],
    ["election day evening", "2026-11-29T21:00:00+01:00"],
    ["after election day", "2026-11-30T09:00:00+01:00"],
  ])("renders nothing on %s", (_label, instant) => {
    const { container } = renderAt(instant);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides itself when the clock crosses into election day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-28T23:59:30+01:00"));
    const { container } = render(<ElectionCountdown />);
    expect(container).not.toBeEmptyDOMElement();
    act(() => vi.advanceTimersByTime(60_000));
    expect(container).toBeEmptyDOMElement();
  });
});
