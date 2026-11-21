import { useCallback, useEffect, useState } from "react";
import { buildHash, parseRoute, type Route } from "./route";

function readCurrentRoute(): Route | null {
  return parseRoute(window.location.hash);
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
