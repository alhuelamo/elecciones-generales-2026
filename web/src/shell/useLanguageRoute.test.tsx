import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLanguageRoute } from "./useLanguageRoute";

const BASE = import.meta.env.BASE_URL;

function openAt(path: string) {
  window.history.replaceState(null, "", `${BASE}${path}`);
}

describe("useLanguageRoute path sync", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["es-ES"]);
    openAt("");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it("detects the language at the root and keeps the hash", () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["ca-ES"]);
    openAt("#/08019/senado");
    const { result } = renderHook(() => useLanguageRoute());
    expect(window.location.pathname).toBe(`${BASE}ca/`);
    expect(window.location.hash).toBe("#/08019/senado");
    expect(result.current[0]).toMatchObject({ language: "ca", page: "ballot" });
  });

  it("detects the language at the root with an empty hash", () => {
    renderHook(() => useLanguageRoute());
    expect(window.location.pathname).toBe(`${BASE}es/`);
  });

  it.each(["", "es/", "ca/"])(
    "migrates a legacy hash opened from %s",
    (path) => {
      openAt(`${path}#/eu/08019/senado`);
      const { result } = renderHook(() => useLanguageRoute());
      expect(window.location.pathname).toBe(`${BASE}eu/`);
      expect(window.location.hash).toBe("#/08019/senado");
      expect(result.current[0]).toMatchObject({ language: "eu" });
    },
  );

  it("migrates a legacy home hash", () => {
    openAt("eu/#/gl");
    renderHook(() => useLanguageRoute());
    expect(window.location.pathname).toBe(`${BASE}gl/`);
    expect(window.location.hash).toBe("#/");
  });

  it("keeps a canonical url untouched", () => {
    openAt("ca/#/08019/congreso/pp");
    const { result } = renderHook(() => useLanguageRoute());
    expect(window.location.pathname).toBe(`${BASE}ca/`);
    expect(window.location.hash).toBe("#/08019/congreso/pp");
    expect(result.current[0]).toMatchObject({ language: "ca" });
  });

  it("switches language in the path keeping the hash", () => {
    openAt("eu/#/about");
    const { result, rerender } = renderHook(() => useLanguageRoute());
    result.current[1]({ page: "about", language: "gl" });
    rerender();
    expect(window.location.pathname).toBe(`${BASE}gl/`);
    expect(window.location.hash).toBe("#/about");
    expect(document.documentElement.lang).toBe("gl");
    expect(localStorage.getItem("eg26.lang")).toBe("gl");
  });
});
