import { render, screen } from "@testing-library/react";
import i18next from "i18next";
import { afterEach, describe, expect, it } from "vitest";
import { HowToVote } from "./HowToVote";

describe("HowToVote", () => {
  afterEach(async () => {
    await i18next.changeLanguage("es");
  });

  it("explains the congreso ballot in catalan", async () => {
    await i18next.changeLanguage("ca");
    render(<HowToVote chamber="congreso" maxMarks={null} />);
    expect(screen.getByText(/sobre blanc/)).toBeInTheDocument();
  });

  it("explains the senado ballot with the maximum marks", () => {
    render(<HowToVote chamber="senado" maxMarks={3} />);
    const help = screen.getByText(/sepia/);
    expect(help).toHaveTextContent("hasta 3");
  });

  it("shows an envelope swatch per chamber", () => {
    const { rerender } = render(
      <HowToVote chamber="congreso" maxMarks={null} />,
    );
    expect(screen.getByTestId("envelope-swatch")).toHaveAttribute(
      "data-chamber",
      "congreso",
    );
    rerender(<HowToVote chamber="senado" maxMarks={3} />);
    expect(screen.getByTestId("envelope-swatch")).toHaveAttribute(
      "data-chamber",
      "senado",
    );
  });

  it("renders the envelope icon inside the swatch", () => {
    render(<HowToVote chamber="senado" maxMarks={3} />);
    expect(
      screen
        .getByTestId("envelope-swatch")
        .querySelector('svg[aria-hidden="true"]'),
    ).not.toBeNull();
  });
});
