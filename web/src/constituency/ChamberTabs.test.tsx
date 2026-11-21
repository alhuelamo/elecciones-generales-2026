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
});
