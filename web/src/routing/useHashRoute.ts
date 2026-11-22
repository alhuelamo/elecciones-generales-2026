import { useCallback, useEffect, useState } from "react";
import { languageFromPathname } from "./languagePath";
import { buildHash, parseRoute, type Route } from "./route";

function readCurrentRoute(): Route | null {
  const hashRoute = parseRoute(window.location.hash);
  if (hashRoute) return hashRoute;
  const pathLanguage = languageFromPathname(window.location.pathname);
  return pathLanguage ? { page: "home", language: pathLanguage } : null;
}

export function useHashRoute(): [Route | null, (route: Route) => void] {
  const [route, setRoute] = useState<Route | null>(readCurrentRoute);

  useEffect(() => {
    const syncRoute = () => setRoute(readCurrentRoute());
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  const navigate = useCallback((next: Route) => {
    window.location.hash = buildHash(next);
  }, []);

  return [route, navigate];
}
