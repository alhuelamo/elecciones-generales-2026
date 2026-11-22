import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Language, Municipality } from "../contract/types";
import type { Route } from "../routing/route";
import { fixtureIndex } from "../test/fixtures";
import type { BallotData } from "./useBallotData";
import { useDocumentTitle } from "./useDocumentTitle";

const sanSebastian: Municipality = {
  ...fixtureIndex.municipalities.find(({ code }) => code === "20069")!,
  name: { es: "San Sebastián", ca: "Donostia", eu: "Donostia" },
};

function ballotRoute(language: Language): Route {
  return {
    page: "ballot",
    language,
    municipalityCode: "20069",
    chamber: "congreso",
    partySlug: null,
  };
}

function ballotData(): BallotData {
  return {
    status: "ready",
    index: fixtureIndex,
    ballot: null,
    partyCatalog: null,
    municipality: sanSebastian,
    constituency: null,
    candidacy: null,
  };
}

describe("useDocumentTitle", () => {
  it("uses the basque municipality name in basque", () => {
    renderHook(() => useDocumentTitle(ballotRoute("eu"), ballotData()));
    expect(document.title).toContain("Donostia");
  });

  it("falls back to the spanish name when galician is missing", () => {
    renderHook(() => useDocumentTitle(ballotRoute("gl"), ballotData()));
    expect(document.title).toContain("San Sebastián");
    expect(document.title).not.toContain("undefined");
  });
});
