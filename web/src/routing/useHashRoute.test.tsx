import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useHashRoute } from "./useHashRoute";

describe("useHashRoute", () => {
  beforeEach(() => {
    window.location.hash = "#/es";
  });

  it("returns the current route", () => {
    const { result } = renderHook(() => useHashRoute());
    expect(result.current[0]).toEqual({ page: "home", language: "es" });
  });

  it("navigate sets the location hash", () => {
    const { result } = renderHook(() => useHashRoute());
    act(() => result.current[1]({ page: "about", language: "ca" }));
    expect(window.location.hash).toBe("#/ca/about");
  });

  it("updates on hashchange", () => {
    const { result } = renderHook(() => useHashRoute());
    act(() => {
      window.location.hash = "#/ca/08019/senado";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(result.current[0]).toEqual({
      page: "ballot",
      language: "ca",
      municipalityCode: "08019",
      chamber: "senado",
      partySlug: null,
    });
  });
});
