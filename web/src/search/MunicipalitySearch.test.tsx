import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { fixtureIndex } from "../test/fixtures";
import { MunicipalitySearch } from "./MunicipalitySearch";

function renderSearch() {
  const onSelect = vi.fn();
  render(<MunicipalitySearch index={fixtureIndex} onSelect={onSelect} />);
  return onSelect;
}

describe("MunicipalitySearch", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("shows the municipality with its province", async () => {
    renderSearch();
    await userEvent.type(screen.getByRole("combobox"), "palma");
    const option = await screen.findByRole("option");
    expect(option).toHaveTextContent("Palma");
    expect(option).toHaveTextContent("Illes Balears");
  });

  it("selects with Enter", async () => {
    const onSelect = renderSearch();
    await userEvent.type(screen.getByRole("combobox"), "palma");
    await screen.findByRole("option");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ code: "07040" }),
    );
  });

  it("selects with click", async () => {
    const onSelect = renderSearch();
    await userEvent.type(screen.getByRole("combobox"), "palma");
    await userEvent.click(await screen.findByRole("option"));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ code: "07040" }),
    );
  });

  it("shows noResults when nothing matches", async () => {
    renderSearch();
    await userEvent.type(screen.getByRole("combobox"), "zzzz");
    expect(await screen.findByText("Sin resultados")).toBeInTheDocument();
  });
});
