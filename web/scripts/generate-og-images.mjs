import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const WEB_ROOT = resolve(import.meta.dirname, "..");
const LANGUAGES = ["es", "ca", "eu", "gl"];
const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FONTS = {
  fraunces:
    "node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2",
  atkinson:
    "node_modules/@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2",
};

function fontUrl(relativePath) {
  return `file://${join(WEB_ROOT, relativePath)}`;
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

function readMeta(language) {
  const path = join(WEB_ROOT, `src/i18n/locales/${language}/meta.json`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function renderHtml({ title, imageSubtitle }) {
  return `<!doctype html>
<meta charset="utf-8" />
<style>
  @font-face { font-family: Fraunces; font-weight: 100 900; src: url("${fontUrl(FONTS.fraunces)}"); }
  @font-face { font-family: Atkinson; font-weight: 200 800; src: url("${fontUrl(FONTS.atkinson)}"); }
  html, body { margin: 0; width: 1200px; height: 630px; background: #faf7f0; color: #1b1b1f; overflow: hidden; }
  body { display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .mark { font: 900 230px/1 Fraunces; letter-spacing: -2px; display: flex; align-items: center; gap: 22px; margin-top: -20px; }
  .dot { width: 52px; height: 52px; border-radius: 50%; background: #8a5a22; }
  .rule { width: 300px; height: 2px; background: #8d887e; margin: 56px 0 44px; }
  .caption { font: 500 36px/1 Atkinson; white-space: nowrap; }
</style>
<div class="mark"><span>29</span><span class="dot"></span><span>N</span></div>
<div class="rule"></div>
<div class="caption">${escapeHtml(title)} · ${escapeHtml(imageSubtitle)}</div>`;
}

function screenshot(htmlPath, outputPath) {
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--window-size=1200,630",
      "--allow-file-access-from-files",
      "--virtual-time-budget=3000",
      `--screenshot=${outputPath}`,
      `file://${htmlPath}`,
    ],
    { stdio: "ignore" },
  );
}

const scratch = mkdtempSync(join(tmpdir(), "og-"));
try {
  for (const language of LANGUAGES) {
    const htmlPath = join(scratch, `${language}.html`);
    writeFileSync(htmlPath, renderHtml(readMeta(language)));
    const fileName =
      language === "es" ? "og-image-es.png" : `og-image-${language}.png`;
    screenshot(htmlPath, join(WEB_ROOT, "public", fileName));
  }
} finally {
  rmSync(scratch, { recursive: true });
}
