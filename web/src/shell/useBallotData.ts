import { useEffect, useState } from "react";
import type {
  Candidacy,
  Chamber,
  ConstituencyBallot,
  ConstituencySummary,
  Municipality,
  MunicipalityIndex,
  PartyCatalog,
} from "../contract/types";
import {
  loadBallot,
  loadMunicipalityIndex,
  loadPartyCatalog,
} from "../data/loaders";
import type { Route } from "../routing/route";

export interface BallotData {
  status: "loading" | "ready" | "error";
  index: MunicipalityIndex | null;
  ballot: ConstituencyBallot | null;
  partyCatalog: PartyCatalog | null;
  municipality: Municipality | null;
  constituency: ConstituencySummary | null;
  candidacy: Candidacy | null;
}

interface LoadedBallot {
  key: string;
  ballot: ConstituencyBallot | null;
  failed: boolean;
}

function useIndexAndCatalog() {
  const [index, setIndex] = useState<MunicipalityIndex | null>(null);
  const [partyCatalog, setPartyCatalog] = useState<PartyCatalog | null>(null);
  const [indexFailed, setIndexFailed] = useState(false);

  useEffect(() => {
    loadMunicipalityIndex().then(setIndex, () => setIndexFailed(true));
    loadPartyCatalog().then(setPartyCatalog, () => setPartyCatalog(null));
  }, []);

  return { index, partyCatalog, indexFailed };
}

function findMunicipality(
  index: MunicipalityIndex | null,
  route: Route | null,
) {
  if (index === null || route?.page !== "ballot") return null;
  return (
    index.municipalities.find(({ code }) => code === route.municipalityCode) ??
    null
  );
}

const CHAMBERS: Chamber[] = ["congreso", "senado"];

function ballotKey(chamber: Chamber, constituencyId: string) {
  return `${chamber}/${constituencyId}`;
}

function useMunicipalityBallots(municipality: Municipality | null) {
  const [loaded, setLoaded] = useState<Record<string, LoadedBallot>>({});

  useEffect(() => {
    if (!municipality) return;
    let cancelled = false;
    const store = (entry: LoadedBallot) =>
      !cancelled &&
      setLoaded((previous) => ({ ...previous, [entry.key]: entry }));
    for (const chamber of CHAMBERS) {
      const key = ballotKey(chamber, municipality[chamber]);
      loadBallot(chamber, municipality[chamber]).then(
        (ballot) => store({ key, ballot, failed: false }),
        () => store({ key, ballot: null, failed: true }),
      );
    }
    return () => {
      cancelled = true;
    };
  }, [municipality]);

  return loaded;
}

function useLoadedBallot(
  route: Route | null,
  municipality: Municipality | null,
) {
  const loaded = useMunicipalityBallots(municipality);
  const chamber = route?.page === "ballot" ? route.chamber : null;
  const key =
    chamber && municipality ? ballotKey(chamber, municipality[chamber]) : null;
  const current = key ? loaded[key] : undefined;
  return {
    key,
    ballot: current?.ballot ?? null,
    failed: current?.failed ?? false,
  };
}

export function useBallotData(route: Route | null): BallotData {
  const { index, partyCatalog, indexFailed } = useIndexAndCatalog();
  const municipality = findMunicipality(index, route);
  const { key, ballot, failed } = useLoadedBallot(route, municipality);

  const constituency =
    ballot && index
      ? (index.constituencies[ballot.chamber].find(
          ({ id }) => id === ballot.constituencyId,
        ) ?? null)
      : null;
  const partySlug = route?.page === "ballot" ? route.partySlug : null;
  const candidacy =
    ballot?.candidacies.find(({ slug }) => slug === partySlug) ?? null;

  return {
    status: resolveStatus(indexFailed || failed, index, key, ballot),
    index,
    ballot,
    partyCatalog,
    municipality,
    constituency,
    candidacy,
  };
}

function resolveStatus(
  failed: boolean,
  index: MunicipalityIndex | null,
  key: string | null,
  ballot: ConstituencyBallot | null,
): BallotData["status"] {
  if (failed) return "error";
  if (index === null) return "loading";
  return key !== null && ballot === null ? "loading" : "ready";
}
