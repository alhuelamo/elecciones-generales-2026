import { useEffect, useState } from "react";
import type {
  Candidacy,
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

function useLoadedBallot(
  route: Route | null,
  municipality: Municipality | null,
) {
  const [loaded, setLoaded] = useState<LoadedBallot | null>(null);
  const chamber = route?.page === "ballot" ? route.chamber : null;
  const constituencyId = municipality && chamber ? municipality[chamber] : null;
  const key = chamber && constituencyId ? `${chamber}/${constituencyId}` : null;

  useEffect(() => {
    if (!chamber || !constituencyId || !key) return;
    let cancelled = false;
    loadBallot(chamber, constituencyId).then(
      (ballot) => !cancelled && setLoaded({ key, ballot, failed: false }),
      () => !cancelled && setLoaded({ key, ballot: null, failed: true }),
    );
    return () => {
      cancelled = true;
    };
  }, [chamber, constituencyId, key]);

  const current = loaded?.key === key ? loaded : null;
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
