import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BASE_URL = import.meta.env.BASE_URL;

describe("loaders", () => {
  let fetchStub: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    fetchStub = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ marker: true }),
    });
    vi.stubGlobal("fetch", fetchStub);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the ballot path", async () => {
    const { loadBallot } = await import("./loaders");
    await loadBallot("senado", "07-mallorca");
    expect(fetchStub).toHaveBeenCalledWith(
      `${BASE_URL}data/senado/07-mallorca.json`,
    );
  });

  it("requests the municipality index and party catalog paths", async () => {
    const { loadMunicipalityIndex, loadPartyCatalog } =
      await import("./loaders");
    await loadMunicipalityIndex();
    await loadPartyCatalog();
    expect(fetchStub).toHaveBeenCalledWith(
      `${BASE_URL}data/municipalities.json`,
    );
    expect(fetchStub).toHaveBeenCalledWith(`${BASE_URL}data/parties.json`);
  });

  it("reuses the same promise for repeated calls", async () => {
    const { loadBallot } = await import("./loaders");
    const first = loadBallot("senado", "07-mallorca");
    const second = loadBallot("senado", "07-mallorca");
    expect(second).toBe(first);
    await first;
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });

  it("rejects with DataLoadError on a non-ok response", async () => {
    fetchStub.mockResolvedValue({ ok: false, status: 404 });
    const { loadBallot, DataLoadError } = await import("./loaders");
    await expect(loadBallot("congreso", "28")).rejects.toBeInstanceOf(
      DataLoadError,
    );
  });
});
