/// <reference types="node" />
import { render, screen } from "@testing-library/react";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ExternalLink } from "./ExternalLink";

const SOURCE_DIR = "src";
const COMPONENT_FILE = join("src", "design", "ExternalLink.tsx");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(entry.name) && !/\.test\./.test(entry.name)
      ? [path]
      : [];
  });
}

describe("ExternalLink", () => {
  it("opens in a new tab without leaking the opener", () => {
    render(
      <ExternalLink href="https://example.org" className="underline">
        Example
      </ExternalLink>,
    );
    const link = screen.getByRole("link", { name: "Example" });
    expect(link).toHaveAttribute("href", "https://example.org");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveClass("underline");
  });

  it("is the only place that builds external anchors", () => {
    const offenders = sourceFiles(SOURCE_DIR).filter(
      (path) =>
        path !== COMPONENT_FILE &&
        /noopener|target="_blank"/.test(readFileSync(path, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
