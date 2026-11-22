import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useLanguageRoute } from "./useLanguageRoute";

const BASE = import.meta.env.BASE_URL;

describe("useLanguageRoute path sync", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", BASE);
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("puts the language in the path keeping the hash", () => {
    window.location.hash = "#/eu/08019/senado";
    renderHook(() => useLanguageRoute());
    expect(window.location.pathname).toBe(`${BASE}eu/`);
    expect(window.location.hash).toBe("#/eu/08019/senado");
  });

  it("follows language changes", () => {
    window.location.hash = "#/eu";
    const { rerender } = renderHook(() => useLanguageRoute());
    window.history.replaceState(null, "", "#/gl/about");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    rerender();
    expect(window.location.pathname).toBe(`${BASE}gl/`);
    expect(window.location.hash).toBe("#/gl/about");
  });

  it("keeps the path language when the hash has none", () => {
    window.history.replaceState(null, "", `${BASE}ca/`);
    const { result } = renderHook(() => useLanguageRoute());
    expect(result.current[0]).toEqual({ page: "home", language: "ca" });
    expect(window.location.pathname).toBe(`${BASE}ca/`);
  });
});
