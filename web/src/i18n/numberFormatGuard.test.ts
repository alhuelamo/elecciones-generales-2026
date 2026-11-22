/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_DIR = "src";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\./.test(entry.name)
      ? [path]
      : [];
  });
}

describe("number formatting", () => {
  it("never passes the raw i18n language to Intl.NumberFormat", () => {
    const offenders = sourceFiles(SOURCE_DIR).filter((path) =>
      /NumberFormat\(\s*i18n\.language/.test(readFileSync(path, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
