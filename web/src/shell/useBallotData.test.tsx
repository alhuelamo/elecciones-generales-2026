import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Chamber } from "../contract/types";
import * as loaders from "../data/loaders";
import type { Route } from "../routing/route";
import {
  buildFixtureBallot,
  buildFixtureSenadoCandidacies,
  fixtureCatalog,
  fixtureCongresoBarcelona,
  fixtureIndex,
} from "../test/fixtures";
import { useBallotData } from "./useBallotData";

const fixtureSenadoBarcelona = buildFixtureBallot(
  "senado",
  "08",
  buildFixtureSenadoCandidacies(3),
);

function barcelonaRoute(chamber: Chamber): Route {
  return {
    page: "ballot",
    language: "es",
    municipalityCode: "08019",
    chamber,
    partySlug: null,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(loaders, "loadMunicipalityIndex").mockResolvedValue(fixtureIndex);
  vi.spyOn(loaders, "loadPartyCatalog").mockResolvedValue(fixtureCatalog);
  vi.spyOn(loaders, "loadBallot").mockImplementation(async (chamber) =>
    chamber === "congreso" ? fixtureCongresoBarcelona : fixtureSenadoBarcelona,
  );
});

describe("useBallotData", () => {
  it("loads the ballot for the routed chamber", async () => {
    const { result } = renderHook(() =>
      useBallotData(barcelonaRoute("congreso")),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.ballot).toBe(fixtureCongresoBarcelona);
  });

  it("prefetches the other chamber of the same municipality", async () => {
    renderHook(() => useBallotData(barcelonaRoute("congreso")));
    await waitFor(() =>
      expect(loaders.loadBallot).toHaveBeenCalledWith("senado", "08"),
    );
  });

  it("switches chamber without passing through a loading state", async () => {
    const { result, rerender } = renderHook(
      (route: Route) => useBallotData(route),
      { initialProps: barcelonaRoute("congreso") },
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));
    await waitFor(() =>
      expect(loaders.loadBallot).toHaveBeenCalledWith("senado", "08"),
    );
    await Promise.resolve();

    rerender(barcelonaRoute("senado"));

    expect(result.current.status).toBe("ready");
    expect(result.current.ballot).toBe(fixtureSenadoBarcelona);
  });
});
