import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import type { Language } from "../contract/types";

type Resources = Record<string, Record<string, object>>;

const localeModules = import.meta.glob<object>("./locales/*/*.json", {
  eager: true,
  import: "default",
});

function buildResources(): Resources {
  const resources: Resources = {};
  for (const [path, content] of Object.entries(localeModules)) {
    const [, language, file] = path.match(
      /\.\/locales\/([^/]+)\/([^/]+)\.json$/,
    )!;
    resources[language] = { ...resources[language], [file]: content };
  }
  return resources;
}

export function initI18n(language: Language): typeof i18next {
  i18next.use(initReactI18next).init({
    resources: buildResources(),
    lng: language,
    fallbackLng: "es",
    defaultNS: "common",
    interpolation: { escapeValue: false },
    initAsync: false,
  });
  return i18next;
}
