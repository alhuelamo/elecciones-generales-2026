import { describe, expect, it } from "vitest";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type Language,
} from "./languages";

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

const TRANSLATED_LANGUAGES = SUPPORTED_LANGUAGES.filter(
  (language) => language !== DEFAULT_LANGUAGE,
);

const IDENTICAL_ALLOWED: Partial<Record<Language, string[]>> = {
  eu: [
    "party.links.wikipedia",
    "shell.footer.sources.boe",
    "shell.footer.sources.ine",
    "shell.footer.sources.interior",
    "theme.choice.system",
  ],
  gl: [
    "about.logos.by",
    "about.sources.boeCandidacies",
    "about.updated.label",
    "candidacies.coalition",
    "candidacies.ordering.alphabetical",
    "candidacies.ordering.label",
    "candidacies.ordering.votes2023",
    "candidacies.results2023.as",
    "common.chamber.congreso",
    "common.chamber.senado",
    "common.loading",
    "constituency.tabsLabel",
    "party.back",
    "party.candidates",
    "party.coalition",
    "party.facts.founded",
    "party.facts.leader",
    "party.facts.seats2023Value",
    "party.links.website",
    "party.links.wikipedia",
    "party.substitute",
    "party.substitutes",
    "party.substitutesOf",
    "results2023.turnout",
    "results2023.votes",
    "shell.footer.sources.boe",
    "shell.footer.sources.ine",
    "shell.footer.sources.interior",
    "shell.language.label",
    "shell.navigation",
    "theme.choice.light",
    "theme.choice.system",
    "theme.menu.label",
  ],
};

function flattenLocale(language: Language): Record<string, string> {
  return Object.entries(modules)
    .filter(([path]) => path.startsWith(`./locales/${language}/`))
    .reduce<Record<string, string>>((flat, [path, tree]) => {
      const namespace = path.split("/").pop()!.replace(".json", "");
      return { ...flat, ...flatten(tree, `${namespace}.`) };
    }, {});
}

function markers(text: string): string[] {
  return (text.match(/\{\{\s*\w+\s*\}\}|<\/?\w+>/g) ?? []).sort();
}

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

  describe.each(TRANSLATED_LANGUAGES)("%s", (language) => {
    const spanish = flattenLocale(DEFAULT_LANGUAGE);
    const translated = flattenLocale(language);

    it("has the same files as es", () => {
      const filesOf = (code: string) =>
        Object.keys(modules)
          .filter((path) => path.startsWith(`./locales/${code}/`))
          .map((path) => path.split("/").pop())
          .sort();
      expect(filesOf(language)).toEqual(filesOf(DEFAULT_LANGUAGE));
    });

    it("has exactly the es keys", () => {
      expect(Object.keys(translated).sort()).toEqual(
        Object.keys(spanish).sort(),
      );
    });

    it("keeps every placeholder and tag", () => {
      const mismatches = Object.entries(spanish).filter(
        ([key, text]) =>
          translated[key] !== undefined &&
          markers(translated[key]).join() !== markers(text).join(),
      );
      expect(mismatches.map(([key]) => key)).toEqual([]);
    });

    it.runIf(language in IDENTICAL_ALLOWED)(
      "leaves no untranslated es text",
      () => {
        const allowed = IDENTICAL_ALLOWED[language] ?? [];
        const identical = Object.entries(spanish)
          .filter(([key, text]) => translated[key] === text)
          .map(([key]) => key)
          .filter((key) => !allowed.includes(key));
        expect(identical).toEqual([]);
      },
    );

    it.runIf(language in IDENTICAL_ALLOWED)(
      "has no stale allowlist entries",
      () => {
        const stale = (IDENTICAL_ALLOWED[language] ?? []).filter(
          (key) => translated[key] !== spanish[key],
        );
        expect(stale).toEqual([]);
      },
    );
  });
});
