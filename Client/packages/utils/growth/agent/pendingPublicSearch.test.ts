import { describe, expect, it } from "vitest";

import { setPlatformStorage } from "packages/utils/core/storage/platformStorage";

import {
  clearPendingPublicSearch,
  hasPendingPublicSearch,
  PENDING_PUBLIC_SEARCH_KEY,
  setPendingPublicSearch,
  takePendingPublicSearch,
} from "./pendingPublicSearch";

function installSessionMap(map: Map<string, string>) {
  setPlatformStorage({
    persistStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
    local: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
    session: {
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => {
        map.set(k, v);
      },
      removeItem: (k) => {
        map.delete(k);
      },
      clear: () => map.clear(),
    },
  });
}

describe("pendingPublicSearch", () => {
  it("stores trimmed label, consumes once, then is empty", () => {
    const map = new Map<string, string>();
    installSessionMap(map);

    const ring = [
      { lat: 33.75, lon: -84.39 },
      { lat: 33.76, lon: -84.39 },
      { lat: 33.76, lon: -84.38 },
      { lat: 33.75, lon: -84.38 },
    ];

    setPendingPublicSearch({
      label: "  Decatur  ",
      ring,
      overlay: { kind: "isochrone" },
    });

    expect(hasPendingPublicSearch()).toBe(true);
    expect(map.has(PENDING_PUBLIC_SEARCH_KEY)).toBe(true);

    const first = takePendingPublicSearch();
    expect(first).toEqual({
      label: "Decatur",
      ring,
      overlay: { kind: "isochrone" },
    });
    expect(hasPendingPublicSearch()).toBe(false);
    expect(takePendingPublicSearch()).toBe(null);
  });

  it("ignores whitespace-only labels and normalizes corrupt payloads", () => {
    const map = new Map<string, string>();
    installSessionMap(map);

    setPendingPublicSearch({ label: "   ", ring: null, overlay: null });
    expect(map.has(PENDING_PUBLIC_SEARCH_KEY)).toBe(false);
    expect(hasPendingPublicSearch()).toBe(false);

    map.set(PENDING_PUBLIC_SEARCH_KEY, JSON.stringify({ ring: [{ lat: 1, lon: 2 }] }));
    expect(takePendingPublicSearch()).toBe(null);
    expect(map.has(PENDING_PUBLIC_SEARCH_KEY)).toBe(false);

    map.set(
      PENDING_PUBLIC_SEARCH_KEY,
      JSON.stringify({ label: "Buckhead", ring: "not-an-array" })
    );
    expect(takePendingPublicSearch()).toEqual({
      label: "Buckhead",
      ring: null,
      overlay: null,
    });
  });

  it("clears pending search and survives storage failures", () => {
    const map = new Map<string, string>();
    installSessionMap(map);

    setPendingPublicSearch({ label: "Midtown", ring: null, overlay: null });
    clearPendingPublicSearch();
    expect(hasPendingPublicSearch()).toBe(false);

    setPlatformStorage({
      persistStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
      local: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
      },
      session: {
        getItem: () => {
          throw new Error("unavailable");
        },
        setItem: () => {
          throw new Error("unavailable");
        },
        removeItem: () => {
          throw new Error("unavailable");
        },
        clear: () => {},
      },
    });

    setPendingPublicSearch({ label: "Midtown", ring: null, overlay: null });
    expect(hasPendingPublicSearch()).toBe(false);
    expect(takePendingPublicSearch()).toBe(null);
    expect(() => clearPendingPublicSearch()).not.toThrow();
  });

  it("returns null for corrupt JSON and clears the key", () => {
    const map = new Map<string, string>();
    installSessionMap(map);
    map.set(PENDING_PUBLIC_SEARCH_KEY, "{not-json");
    expect(takePendingPublicSearch()).toBe(null);
    expect(map.has(PENDING_PUBLIC_SEARCH_KEY)).toBe(false);
  });
});
