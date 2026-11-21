import type {
  Chamber,
  ConstituencyBallot,
  MunicipalityIndex,
  PartyCatalog,
} from "../contract/types";

export class DataLoadError extends Error {
  constructor(path: string, status: number) {
    super(`Could not load ${path} (${status})`);
    this.name = "DataLoadError";
  }
}

const cache = new Map<string, Promise<unknown>>();

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path}`);
  if (!response.ok) {
    throw new DataLoadError(path, response.status);
  }
  return response.json() as Promise<T>;
}

function memoizedLoad<T>(path: string): Promise<T> {
  const cached = cache.get(path);
  if (cached) {
    return cached as Promise<T>;
  }
  const pending = fetchJson<T>(path).catch((error) => {
    cache.delete(path);
    throw error;
  });
  cache.set(path, pending);
  return pending;
}

export function loadMunicipalityIndex(): Promise<MunicipalityIndex> {
  return memoizedLoad("data/municipalities.json");
}

export function loadBallot(
  chamber: Chamber,
  constituencyId: string,
): Promise<ConstituencyBallot> {
  return memoizedLoad(`data/${chamber}/${constituencyId}.json`);
}

export function loadPartyCatalog(): Promise<PartyCatalog> {
  return memoizedLoad("data/parties.json");
}
