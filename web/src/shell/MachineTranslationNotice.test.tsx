import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ISSUES_URL } from "../config";
import {
  MachineTranslationNotice,
  translationIssueUrl,
} from "./MachineTranslationNotice";

describe("translationIssueUrl", () => {
  it("round-trips title and body through the query string", () => {
    const issue = { title: "[eu] Itzulpen akatsa", body: "a&b\nc" };
    const url = translationIssueUrl(issue);
    expect(url.startsWith(`${ISSUES_URL}?`)).toBe(true);
    const params = new URL(url).searchParams;
    expect(params.get("title")).toBe(issue.title);
    expect(params.get("body")).toBe(issue.body);
  });
});

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
      expect(link).toHaveClass("min-h-11");
    },
  );

  it.each(["es", "ca"] as const)("renders nothing in %s", (language) => {
    const { container } = render(
      <MachineTranslationNotice language={language} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
