import { describe, expect, it } from "vitest";

import { setPlatformStorage } from "packages/utils/core/storage/platformStorage";

import {
  clearPendingPublicAgentConnect,
  isLikelyUserUuid,
  peekPendingPublicAgentConnect,
  PENDING_PUBLIC_AGENT_CONNECT_KEY,
  setPendingPublicAgentConnect,
} from "./pendingPublicAgentConnect";

describe("pendingPublicAgentConnect", () => {
  it("rejects non-uuid values on set and peek", () => {
    const map = new Map<string, string>();
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

    setPendingPublicAgentConnect("not-a-uuid");
    expect(map.has(PENDING_PUBLIC_AGENT_CONNECT_KEY)).toBe(false);
    expect(peekPendingPublicAgentConnect()).toBe(null);

    const id = "550e8400-e29b-41d4-a716-446655440000";
    setPendingPublicAgentConnect(id);
    expect(peekPendingPublicAgentConnect()).toBe(id);
    clearPendingPublicAgentConnect();
    expect(peekPendingPublicAgentConnect()).toBe(null);
  });

  it("isLikelyUserUuid accepts RFC4122", () => {
    expect(isLikelyUserUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isLikelyUserUuid("abc")).toBe(false);
  });
});
