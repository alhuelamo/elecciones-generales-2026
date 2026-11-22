import { render, screen } from "@testing-library/react";
import i18next from "i18next";
import { afterEach, describe, expect, it } from "vitest";
import { SOURCE_URLS } from "../config";
import { ElectionBanner } from "./ElectionBanner";

function renderAt(instant: string) {
  render(<ElectionBanner now={() => new Date(instant)} />);
}

describe("ElectionBanner", () => {
  afterEach(async () => {
    await i18next.changeLanguage("es");
  });

  it("renders nothing before election day", () => {
    const { container } = render(
      <ElectionBanner now={() => new Date("2026-11-28T12:00:00+01:00")} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("is a framed box on the content column", () => {
    renderAt("2026-11-29T10:00:00+01:00");
    const status = screen.getByRole("status");
    expect(status).toHaveClass("rounded-frame", "border");
    expect(status.parentElement).toHaveClass("max-w-3xl");
  });

  it("announces election day", () => {
    renderAt("2026-11-29T10:00:00+01:00");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Hoy es el día de las elecciones",
    );
  });

  it("links to the official results once polls close", () => {
    renderAt("2026-11-29T20:00:00+01:00");
    expect(
      screen.getByRole("link", { name: /resultados oficiales/ }),
    ).toHaveAttribute("href", SOURCE_URLS.interior);
  });

  it("shows the results banner in catalan", async () => {
    await i18next.changeLanguage("ca");
    renderAt("2026-11-30T09:00:00+01:00");
    expect(
      screen.getByRole("link", { name: /resultats oficials/ }),
    ).toBeVisible();
    expect(screen.queryByText(/resultados/)).toBeNull();
  });
});
