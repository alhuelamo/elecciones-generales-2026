import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { Candidacy } from "../contract/types";
import {
  buildFixtureCongresoCandidacies,
  fixtureCatalog,
} from "../test/fixtures";
import { CandidacyList } from "./CandidacyList";

const candidacies = buildFixtureCongresoCandidacies(2);

function renderList(items: Candidacy[] = candidacies) {
  return render(
    <CandidacyList
      candidacies={items}
      chamber="congreso"
      partyCatalog={fixtureCatalog}
      hrefFor={(candidacy) => `#/es/08/congreso/${candidacy.slug}`}
    />,
  );
}

function renderedDenominations(): string[] {
  return screen
    .getAllByRole("listitem")
    .map((item) => within(item).getByRole("link").textContent ?? "");
}

afterEach(cleanup);

describe("CandidacyList", () => {
  it("renders links in BOE order with hrefFor hrefs", () => {
    renderList();
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "#/es/08/congreso/pea");
    expect(links[0]).toHaveTextContent("PARTIDO EJEMPLO A");
    expect(links[2]).toHaveTextContent("COALICION EJEMPLO C-D");
  });

  it("shows the padded ballot order in a tabular-nums element", () => {
    renderList();
    const order = within(screen.getAllByRole("link")[0]).getByText("01");
    expect(order).toHaveClass("tabular-nums");
  });

  it("renders the list with ruled dividers", () => {
    renderList();
    expect(screen.getByRole("list")).toHaveClass("divide-y");
  });

  it("reorders when alphabetical is selected", async () => {
    const reversed = [...candidacies].reverse().map((candidacy, index) => ({
      ...candidacy,
      boeOrder: index + 1,
      denomination: `${"CBA"[index]} ${candidacy.slug}`,
    }));
    renderList(reversed);
    await userEvent.click(screen.getByLabelText("Alfabético"));
    expect(renderedDenominations()[0]).toContain("A ");
  });

  it("hides votes2023 option when there are no results", () => {
    renderList(candidacies.map((c) => ({ ...c, results2023: null })));
    expect(screen.queryByLabelText("Votos 2023")).toBeNull();
    expect(screen.getByLabelText("Alfabético")).toBeInTheDocument();
  });

  it("shows votes2023 option when results exist", () => {
    renderList();
    expect(screen.getByLabelText("Votos 2023")).toBeInTheDocument();
  });

  it("shows formatted 2023 results and coalition label", () => {
    renderList();
    expect(screen.getByText(/34,12 %/)).toBeInTheDocument();
    expect(screen.getByText("Coalición")).toBeInTheDocument();
  });
});
