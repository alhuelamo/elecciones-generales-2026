import { readFileSync } from "node:fs";
import { SUPPORTED_LANGUAGES, type Language } from "../src/i18n/languages.ts";

export const SITE_URL = "https://alhuelamo.com/elecciones-generales-2026";

const OG_LOCALES: Record<Language, string> = {
  es: "es_ES",
  ca: "ca_ES",
  eu: "eu_ES",
  gl: "gl_ES",
};

export type EntryMeta = {
  title: string;
  description: string;
  shareDescription: string;
};

export function readEntryMeta(language: Language): EntryMeta {
  const path = `src/i18n/locales/${language}/meta.json`;
  return JSON.parse(readFileSync(path, "utf8"));
}

export function localizeIndexHtml(
  html: string,
  language: Language,
  meta: EntryMeta,
): string {
  const pageUrl = `${SITE_URL}/${language}/`;
  return [
    (source: string) =>
      replaceOnce(
        source,
        /<html lang="[^"]*">/,
        () => `<html lang="${language}">`,
      ),
    (source: string) =>
      replaceOnce(
        source,
        /<title>[^<]*<\/title>/,
        () => `<title>${escapeHtml(meta.title)}</title>`,
      ),
    (source: string) =>
      setMeta(source, "name", "description", meta.description),
    (source: string) => setMeta(source, "property", "og:title", meta.title),
    (source: string) => setMeta(source, "property", "og:site_name", meta.title),
    (source: string) =>
      setMeta(source, "property", "og:description", meta.shareDescription),
    (source: string) => setMeta(source, "property", "og:url", pageUrl),
    (source: string) =>
      setMeta(source, "property", "og:locale", OG_LOCALES[language]),
    (source: string) =>
      setMeta(
        source,
        "property",
        "og:image",
        `${SITE_URL}/og-image-${language}.png`,
      ),
    (source: string) => setMeta(source, "name", "twitter:title", meta.title),
    (source: string) =>
      setMeta(source, "name", "twitter:description", meta.shareDescription),
    (source: string) => withAlternateLocales(source, language),
    (source: string) => withCanonical(source, pageUrl),
  ].reduce((current, transform) => transform(current), html);
}

function withAlternateLocales(html: string, language: Language): string {
  const alternates = SUPPORTED_LANGUAGES.filter(
    (candidate) => candidate !== language,
  ).map(
    (candidate) =>
      `<meta property="og:locale:alternate" content="${OG_LOCALES[candidate]}" />`,
  );
  const withoutOld = html.replace(
    /\s*<meta\s+property="og:locale:alternate"\s+content="[^"]*"\s*\/>/g,
    "",
  );
  return replaceOnce(
    withoutOld,
    /(<meta\s+property="og:locale"\s+content="[^"]*"\s*\/>)/,
    ([tag]) => `${tag}\n    ${alternates.join("\n    ")}`,
  );
}

function withCanonical(html: string, pageUrl: string): string {
  return replaceOnce(
    html,
    /<\/head>/,
    () => `  <link rel="canonical" href="${pageUrl}" />\n  </head>`,
  );
}

function setMeta(
  html: string,
  attribute: "name" | "property",
  key: string,
  value: string,
): string {
  const pattern = new RegExp(
    `(<meta\\s+${attribute}="${key}"\\s+content=")[^"]*(")`,
  );
  return replaceOnce(
    html,
    pattern,
    ([, open, close]) => `${open}${escapeAttribute(value)}${close}`,
  );
}

function replaceOnce(
  html: string,
  pattern: RegExp,
  build: (match: RegExpMatchArray) => string,
): string {
  const match = html.match(pattern);
  if (!match) {
    throw new Error(`index.html is missing expected markup: ${pattern}`);
  }
  return html.replace(pattern, () => build(match));
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const escapeAttribute = escapeHtml;
