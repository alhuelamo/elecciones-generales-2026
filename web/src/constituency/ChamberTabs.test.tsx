import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Chamber } from "../contract/types";
import { ChamberTabs } from "./ChamberTabs";

function renderTabs(active: Chamber) {
  return render(
    <ChamberTabs
      active={active}
      chamberHref={(chamber) => `#/es/08019/${chamber}`}
    />,
  );
}

describe("ChamberTabs", () => {
  it("renders one link per chamber with its href", () => {
    renderTabs("congreso");
    expect(screen.getByRole("link", { name: "Congreso" })).toHaveAttribute(
      "href",
      "#/es/08019/congreso",
    );
    expect(screen.getByRole("link", { name: "Senado" })).toHaveAttribute(
      "href",
      "#/es/08019/senado",
    );
  });

  it("marks only the active chamber as current", () => {
    renderTabs("senado");
    expect(screen.getByRole("link", { name: "Senado" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Congreso" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("styles the active tab with the accent underline", () => {
    renderTabs("senado");
    const active = screen.getByRole("link", { name: "Senado" });
    const inactive = screen.getByRole("link", { name: "Congreso" });
    expect(active).toHaveClass("border-accent", "text-ink", "min-h-11");
    expect(inactive).toHaveClass("border-transparent", "min-h-11");
  });
});
