import { describe, expect, it } from "vitest";

type Tree = { [key: string]: string | Tree };

const modules = import.meta.glob<Tree>("./locales/*/*.json", {
  eager: true,
  import: "default",
});

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>(
    (flat, [key, value]) =>
      typeof value === "string"
        ? { ...flat, [`${prefix}${key}`]: value }
        : { ...flat, ...flatten(value, `${prefix}${key}.`) },
    {},
  );
}

const spanishFiles = Object.keys(modules).filter((path) =>
  path.startsWith("./locales/es/"),
);

describe("locale parity", () => {
  it("has at least the common namespace", () => {
    expect(spanishFiles).toContain("./locales/es/common.json");
  });

  it.each(spanishFiles)("%s has a catalan twin with the same keys", (path) => {
    const catalanPath = path.replace("/es/", "/ca/");
    expect(modules[catalanPath]).toBeDefined();
    expect(Object.keys(flatten(modules[catalanPath])).sort()).toEqual(
      Object.keys(flatten(modules[path])).sort(),
    );
  });

  it.each(Object.keys(modules))("%s has no empty strings", (path) => {
    const empty = Object.values(flatten(modules[path])).filter(
      (text) => text.trim() === "",
    );
    expect(empty).toEqual([]);
  });
});
