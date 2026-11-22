import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SUPPORTED_LANGUAGES } from "../src/i18n/languages.ts";
import { localizeIndexHtml, readEntryMeta } from "./entryPages.ts";

const sourceHtml = readFileSync("index.html", "utf8");

const BASE_URL = "https://alhuelamo.com/elecciones-generales-2026";

const LOCALES = {
  es: "es_ES",
  ca: "ca_ES",
  eu: "eu_ES",
  gl: "gl_ES",
} as const;

function metaContent(html: string, key: string): string | undefined {
  const tag = html.match(
    new RegExp(`<meta\\s+(?:name|property)="${key}"\\s+content="([^"]*)"`),
  );
  return tag?.[1];
}

describe("localizeIndexHtml", () => {
  it.each(SUPPORTED_LANGUAGES)("localizes the %s entry page", (language) => {
    const meta = readEntryMeta(language);
    const html = localizeIndexHtml(sourceHtml, language, meta);

    expect(html).toContain(`<html lang="${language}">`);
    expect(html).toContain(`<title>${meta.title}</title>`);
    expect(metaContent(html, "description")).toBe(meta.description);
    expect(metaContent(html, "og:title")).toBe(meta.title);
    expect(metaContent(html, "og:site_name")).toBe(meta.title);
    expect(metaContent(html, "og:description")).toBe(meta.shareDescription);
    expect(metaContent(html, "og:locale")).toBe(LOCALES[language]);
    expect(metaContent(html, "og:url")).toBe(`${BASE_URL}/${language}/`);
    expect(metaContent(html, "og:image")).toBe(
      `${BASE_URL}/og-image-${language}.png`,
    );
    expect(metaContent(html, "twitter:title")).toBe(meta.title);
    expect(metaContent(html, "twitter:description")).toBe(
      meta.shareDescription,
    );
    expect(html).toContain(
      `<link rel="canonical" href="${BASE_URL}/${language}/" />`,
    );
  });

  it("lists the other languages as alternate locales", () => {
    const html = localizeIndexHtml(sourceHtml, "eu", readEntryMeta("eu"));
    const alternates = [
      ...html.matchAll(/property="og:locale:alternate"\s+content="([^"]*)"/g),
    ].map((match) => match[1]);
    expect(alternates).toEqual(["es_ES", "ca_ES", "gl_ES"]);
  });

  it("escapes html in localized strings", () => {
    const html = localizeIndexHtml(sourceHtml, "es", {
      ...readEntryMeta("es"),
      title: 'A & B <"x">',
    });
    expect(html).toContain("<title>A &amp; B &lt;&quot;x&quot;&gt;</title>");
  });

  it("keeps everything else untouched", () => {
    const html = localizeIndexHtml(sourceHtml, "gl", readEntryMeta("gl"));
    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('<script type="module" src="/src/main.tsx">');
    expect(metaContent(html, "og:type")).toBe("website");
  });

  it("fails when the source lacks an expected tag", () => {
    expect(() =>
      localizeIndexHtml('<html lang="es"></html>', "eu", readEntryMeta("eu")),
    ).toThrow();
  });
});
