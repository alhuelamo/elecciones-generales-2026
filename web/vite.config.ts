import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { entryPagesPlugin } from "./build/entryPagesPlugin.ts";

// https://vite.dev/config/
export default defineConfig({
  base: "/elecciones-generales-2026/",
  plugins: [react(), tailwindcss(), entryPagesPlugin()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
