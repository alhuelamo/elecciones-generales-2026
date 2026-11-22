import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { STORAGE_KEYS } from "../config";
import { detectLanguage } from "../i18n/detectLanguage";
import { entryPathname, languageFromPathname } from "../routing/languagePath";
import { languageFromHash, type Route } from "../routing/route";
import { replaceRoute, useHashRoute } from "../routing/useHashRoute";

export { replaceRoute };

function addLanguageToPath() {
  const { search, hash } = window.location;
  const detected = detectLanguage(
    localStorage.getItem(STORAGE_KEYS.language),
    navigator.languages,
  );
  window.history.replaceState(
    null,
    "",
    `${entryPathname(detected)}${search}${hash}`,
  );
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

function isCanonical(route: Route): boolean {
  const { pathname, hash } = window.location;
  return (
    languageFromPathname(pathname) === route.language &&
    languageFromHash(hash) === null
  );
}

export function useLanguageRoute(): [Route | null, (route: Route) => void] {
  const { i18n } = useTranslation();
  const [route, navigate] = useHashRoute();

  useEffect(() => {
    if (route === null) {
      addLanguageToPath();
      return;
    }
    if (!isCanonical(route)) replaceRoute(route);
    localStorage.setItem(STORAGE_KEYS.language, route.language);
    document.documentElement.lang = route.language;
    if (i18n.language !== route.language) i18n.changeLanguage(route.language);
  }, [route, i18n]);

  return [route, navigate];
}
