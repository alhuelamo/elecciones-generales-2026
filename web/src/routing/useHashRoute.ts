import { useCallback, useEffect, useState } from "react";
import { entryPathname, languageFromPathname } from "./languagePath";
import { buildHash, parseRoute, type Route } from "./route";

export function replaceRoute(route: Route) {
  const { search } = window.location;
  const url = `${entryPathname(route.language)}${search}${buildHash(route)}`;
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

function readCurrentRoute(): Route | null {
  return parseRoute(
    window.location.hash,
    languageFromPathname(window.location.pathname),
  );
}

export function useHashRoute(): [Route | null, (route: Route) => void] {
  const [route, setRoute] = useState<Route | null>(readCurrentRoute);

  useEffect(() => {
    const syncRoute = () => setRoute(readCurrentRoute());
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  const navigate = useCallback((next: Route) => {
    const pathLanguage = languageFromPathname(window.location.pathname);
    if (next.language === pathLanguage) {
      window.location.hash = buildHash(next);
      return;
    }
    replaceRoute(next);
  }, []);

  return [route, navigate];
}
