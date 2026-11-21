import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import { STORAGE_KEYS } from "./config";
import { detectLanguage } from "./i18n/detectLanguage";
import { initI18n } from "./i18n";

initI18n(
  detectLanguage(
    localStorage.getItem(STORAGE_KEYS.language),
    navigator.languages,
  ),
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
