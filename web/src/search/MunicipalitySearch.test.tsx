import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18next from "i18next";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { MunicipalityIndex } from "../contract/types";
import { fixtureIndex } from "../test/fixtures";
import { MunicipalitySearch } from "./MunicipalitySearch";

const sparseIndex: MunicipalityIndex = {
  ...fixtureIndex,
  municipalities: fixtureIndex.municipalities.map((municipality) =>
    municipality.code === "20069"
      ? {
          ...municipality,
          name: { es: "San Sebastián", ca: "Donostia", eu: "Donostia" },
        }
      : municipality,
  ),
};

function renderSearch(index: MunicipalityIndex = fixtureIndex) {
  const onSelect = vi.fn();
  render(<MunicipalitySearch index={index} onSelect={onSelect} />);
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

  it("names the focused combobox without a visible label", () => {
    renderSearch();
    expect(screen.queryByText("Buscar municipio")).toBeNull();
    const input = screen.getByRole("combobox", { name: "Buscar municipio" });
    expect(input).toHaveFocus();
  });

  it("frames the input like a chat box", () => {
    renderSearch();
    const frame = screen.getByRole("combobox").parentElement!;
    expect(frame).toHaveClass("rounded-frame", "border", "focus-within:ring-2");
  });

  it("overlays results instead of pushing the page content down", async () => {
    renderSearch();
    await userEvent.type(screen.getByRole("combobox"), "palma");
    const listbox = await screen.findByRole("listbox");
    expect(listbox).toHaveClass("absolute", "overflow-y-auto");
    expect(listbox.parentElement).toHaveClass("relative");
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

  it("shows the basque name in basque", async () => {
    await i18next.changeLanguage("eu");
    renderSearch(sparseIndex);
    await userEvent.type(screen.getByRole("combobox"), "san sebastian");
    expect(await screen.findByRole("option")).toHaveTextContent("Donostia");
  });

  it("falls back to the spanish name in galician", async () => {
    await i18next.changeLanguage("gl");
    renderSearch(sparseIndex);
    await userEvent.type(screen.getByRole("combobox"), "donostia");
    const option = await screen.findByRole("option");
    expect(option).toHaveTextContent("San Sebastián");
    expect(option).not.toHaveTextContent("undefined");
  });
});
