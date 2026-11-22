import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageMenu } from "./LanguageMenu";

function renderMenu(onChange = vi.fn()) {
  render(<LanguageMenu active="es" onChange={onChange} />);
  return onChange;
}

describe("LanguageMenu", () => {
  afterEach(cleanup);

  it("names the button after the active language and shows its code", () => {
    renderMenu();
    const button = screen.getByRole("button", { name: "Idioma: Castellano" });
    expect(button).toHaveTextContent("ES");
    expect(button).toHaveClass("min-h-11", "min-w-11");
  });

  it("lists the four languages with their lang attribute", async () => {
    renderMenu();
    await userEvent.click(screen.getByRole("button"));
    const items = screen.getAllByRole("menuitem");
    expect(items.map((item) => item.textContent?.replace("✓", ""))).toEqual([
      "Castellano",
      "Català",
      "Euskara",
      "Galego",
    ]);
    expect(items.map((item) => item.getAttribute("lang"))).toEqual([
      "es",
      "ca",
      "eu",
      "gl",
    ]);
  });

  it("marks the current choice with a hidden check glyph", async () => {
    renderMenu();
    await userEvent.click(screen.getByRole("button"));
    const check = screen.getByText("✓");
    expect(check).toHaveAttribute("aria-hidden", "true");
    expect(check.closest("[role='menuitem']")).toHaveTextContent("Castellano");
  });

  it("notifies the chosen language", async () => {
    const onChange = renderMenu();
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByRole("menuitem", { name: /Euskara/ }));
    expect(onChange).toHaveBeenCalledWith("eu");
  });

  it("is operable by keyboard and returns focus to the button", async () => {
    const onChange = renderMenu();
    const button = screen.getByRole("button");
    button.focus();
    await userEvent.keyboard("{Enter}{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenCalledWith("ca");
    await waitFor(() => expect(button).toHaveFocus());
  });
});
