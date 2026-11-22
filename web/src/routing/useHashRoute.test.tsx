import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useHashRoute } from "./useHashRoute";

const BASE = import.meta.env.BASE_URL;

describe("useHashRoute", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", `${BASE}es/#/`);
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("returns the current route from the path language", () => {
    const { result } = renderHook(() => useHashRoute());
    expect(result.current[0]).toEqual({ page: "home", language: "es" });
  });

  it("returns null when neither path nor hash has a language", () => {
    window.history.replaceState(null, "", BASE);
    const { result } = renderHook(() => useHashRoute());
    expect(result.current[0]).toBeNull();
  });

  it("navigate within the language sets only the hash", () => {
    const { result } = renderHook(() => useHashRoute());
    act(() => result.current[1]({ page: "about", language: "es" }));
    expect(window.location.pathname).toBe(`${BASE}es/`);
    expect(window.location.hash).toBe("#/about");
  });

  it("navigate to another language replaces the path and keeps the hash", () => {
    const { result } = renderHook(() => useHashRoute());
    const historyLength = window.history.length;
    act(() => result.current[1]({ page: "about", language: "ca" }));
    expect(window.location.pathname).toBe(`${BASE}ca/`);
    expect(window.location.hash).toBe("#/about");
    expect(window.history.length).toBe(historyLength);
    expect(result.current[0]).toEqual({ page: "about", language: "ca" });
  });

  it("updates on hashchange", () => {
    const { result } = renderHook(() => useHashRoute());
    act(() => {
      window.location.hash = "#/08019/senado";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(result.current[0]).toEqual({
      page: "ballot",
      language: "es",
      municipalityCode: "08019",
      chamber: "senado",
      partySlug: null,
    });
  });

  it("lets a legacy hash language win over the path", () => {
    window.history.replaceState(null, "", `${BASE}eu/#/ca/about`);
    const { result } = renderHook(() => useHashRoute());
    expect(result.current[0]).toEqual({ page: "about", language: "ca" });
  });
});
