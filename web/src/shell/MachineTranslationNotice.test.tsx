import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ISSUES_URL } from "../config";
import { MachineTranslationNotice } from "./MachineTranslationNotice";

describe("MachineTranslationNotice", () => {
  it.each(["eu", "gl"] as const)(
    "links to a prefilled issue in %s",
    (language) => {
      render(<MachineTranslationNotice language={language} />);
      const link = screen.getByRole("link");
      expect(link.getAttribute("href")).toMatch(
        new RegExp(`^${ISSUES_URL}\\?.*title=`),
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveClass("py-3", "-my-3");
    },
  );

  it.each(["es", "ca"] as const)("renders nothing in %s", (language) => {
    const { container } = render(
      <MachineTranslationNotice language={language} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
