import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { STORAGE_KEYS } from "../config";
import { detectLanguage } from "../i18n/detectLanguage";
import { buildHash, type Route } from "../routing/route";
import { useHashRoute } from "../routing/useHashRoute";

export function replaceRoute(route: Route) {
  window.history.replaceState(null, "", buildHash(route));
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function useLanguageRoute(): [Route | null, (route: Route) => void] {
  const { i18n } = useTranslation();
  const [route, navigate] = useHashRoute();
  const language = route?.language ?? null;

  useEffect(() => {
    if (language === null) {
      const detected = detectLanguage(
        localStorage.getItem(STORAGE_KEYS.language),
        navigator.languages,
      );
      replaceRoute({ page: "home", language: detected });
      return;
    }
    localStorage.setItem(STORAGE_KEYS.language, language);
    document.documentElement.lang = language;
    if (i18n.language !== language) i18n.changeLanguage(language);
  }, [language, i18n]);

  return [route, navigate];
}
