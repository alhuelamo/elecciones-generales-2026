import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Envelope } from "./Envelope";

describe("Envelope", () => {
  it("renders a hidden svg tagged with the chamber", () => {
    const { container } = render(<Envelope chamber="senado" />);
    expect(
      container.querySelector('svg[aria-hidden="true"][data-chamber="senado"]'),
    ).not.toBeNull();
  });

  it.each([
    ["congreso", "fill-paper-raised"],
    ["senado", "fill-kraft"],
  ] as const)("fills %s with %s", (chamber, fillClass) => {
    const { container } = render(<Envelope chamber={chamber} />);
    expect(container.querySelector("rect")?.classList.contains(fillClass)).toBe(
      true,
    );
  });
});
