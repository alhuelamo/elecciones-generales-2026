import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18next from "i18next";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
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

  it("renders a visible label for the focused combobox", () => {
    renderSearch();
    expect(screen.getByText("Buscar municipio")).not.toHaveClass("sr-only");
    const input = screen.getByLabelText("Buscar municipio");
    expect(input).toBe(screen.getByRole("combobox"));
    expect(input).toHaveFocus();
    expect(input).toHaveClass("h-14", "border-b-2");
  });

  it("gives each option a comfortable tap target", async () => {
    renderSearch();
    await userEvent.type(screen.getByRole("combobox"), "palma");
    expect(await screen.findByRole("option")).toHaveClass("min-h-11");
  });

  it("shows the municipality with its province", async () => {
    renderSearch();
    await userEvent.type(screen.getByRole("combobox"), "palma");
    const option = await screen.findByRole("option");
    expect(option).toHaveTextContent("Palma");
    expect(option).toHaveTextContent("Illes Balears");
  });

  afterEach(async () => {
    await i18next.changeLanguage("es");
  });

  it("shows only the spanish name when searching the catalan alias", async () => {
    renderSearch();
    await userEvent.type(screen.getByRole("combobox"), "alacant");
    const option = await screen.findByRole("option");
    expect(option).toHaveTextContent("Alicante");
    expect(option).not.toHaveTextContent("Alacant");
    expect(option).not.toHaveTextContent("/");
  });

  it("shows only the catalan name and province in catalan", async () => {
    await i18next.changeLanguage("ca");
    renderSearch();
    await userEvent.type(screen.getByRole("combobox"), "san sebastian");
    const option = await screen.findByRole("option");
    expect(option).toHaveTextContent("Sant Sebastià");
    expect(option).not.toHaveTextContent("San Sebastián");
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
