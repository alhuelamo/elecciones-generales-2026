import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18next from "i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BallotData } from "../shell/useBallotData";
import { fixtureIndex } from "../test/fixtures";
import { HomePage } from "./HomePage";

const data: BallotData = {
  status: "ready",
  index: fixtureIndex,
  ballot: null,
  partyCatalog: null,
  municipality: null,
  constituency: null,
  candidacy: null,
};

function renderHome(navigate = vi.fn()) {
  render(<HomePage language="es" data={data} navigate={navigate} />);
  return navigate;
}

describe("HomePage", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-21T12:00:00+01:00"));
    await i18next.changeLanguage("es");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the display heading", () => {
    renderHome();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "¿Qué hay en tu papeleta?",
      }),
    ).toHaveClass("font-display");
  });

  it("focuses the search field", () => {
    renderHome();
    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("shows the countdown before election day", () => {
    renderHome();
    expect(screen.getByText(/Faltan/)).toBeInTheDocument();
  });

  it.each(["2026-11-29T10:00:00+01:00", "2026-11-29T21:00:00+01:00"])(
    "hides the countdown at %s",
    (instant) => {
      vi.setSystemTime(new Date(instant));
      renderHome();
      expect(screen.queryByText(/Falta/)).not.toBeInTheDocument();
      expect(screen.queryByText("Hoy se vota")).not.toBeInTheDocument();
    },
  );

  it("renders the voting cards with both envelopes", () => {
    const { container } = render(
      <HomePage language="es" data={data} navigate={vi.fn()} />,
    );
    expect(
      screen.getByRole("heading", { name: "Dónde votar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Cómo se vota" }),
    ).toBeInTheDocument();
    expect(
      container.querySelector('svg[data-chamber="congreso"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('svg[data-chamber="senado"]'),
    ).not.toBeNull();
  });

  it("navigates to the ballot of the selected municipality", async () => {
    vi.useRealTimers();
    const navigate = renderHome();
    await userEvent.type(screen.getByRole("combobox"), "Barcelona");
    await userEvent.click(
      await screen.findByRole("option", { name: /Barcelona/ }),
    );
    expect(navigate).toHaveBeenCalledWith({
      page: "ballot",
      language: "es",
      municipalityCode: "08019",
      chamber: "congreso",
      partySlug: null,
    });
  });
});
