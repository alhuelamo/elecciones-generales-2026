import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { SUPPORTED_LANGUAGES } from "../src/i18n/languages.ts";
import { localizeIndexHtml, readEntryMeta } from "./entryPages.ts";

export function entryPagesPlugin(): Plugin {
  let outDir = "dist";
  let base = "/";

  return {
    name: "language-entry-pages",
    configResolved(config) {
      outDir = join(config.root, config.build.outDir);
      base = config.base;
    },
    configureServer(server) {
      const entryPath = new RegExp(
        `^${base}(${SUPPORTED_LANGUAGES.join("|")})/?(\\?.*)?$`,
      );
      server.middlewares.use((request, _response, next) => {
        const match = request.url?.match(entryPath);
        if (match) request.url = `${base}${match[2] ?? ""}`;
        next();
      });
    },
    closeBundle() {
      const builtHtml = readFileSync(join(outDir, "index.html"), "utf8");
      for (const language of SUPPORTED_LANGUAGES) {
        mkdirSync(join(outDir, language), { recursive: true });
        writeFileSync(
          join(outDir, language, "index.html"),
          localizeIndexHtml(builtHtml, language, readEntryMeta(language)),
        );
      }
    },
  };
}
