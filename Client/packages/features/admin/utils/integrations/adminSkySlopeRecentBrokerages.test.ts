import { beforeEach, describe, expect, it } from "vitest";

import { removeFromSessionStorage } from "packages/utils/core/storage/storage";

import {
  filterBrokerageIds,
  listRecentBrokerageIds,
  RECENT_BROKERAGE_IDS_STORAGE_KEY,
  rememberRecentBrokerageId,
} from "./adminSkySlopeRecentBrokerages";

describe("adminSkySlopeRecentBrokerages", () => {
  beforeEach(() => {
    removeFromSessionStorage(RECENT_BROKERAGE_IDS_STORAGE_KEY);
  });

  it("stores and lists recent brokerage ids", () => {
    rememberRecentBrokerageId("a");
    rememberRecentBrokerageId("b");
    expect(listRecentBrokerageIds()).toEqual(["b", "a"]);
  });

  it("dedupes and moves latest id to front", () => {
    rememberRecentBrokerageId("a");
    rememberRecentBrokerageId("b");
    rememberRecentBrokerageId("a");
    expect(listRecentBrokerageIds()).toEqual(["a", "b"]);
  });

  it("filters ids by query", () => {
    expect(filterBrokerageIds(["abc-111", "def-222"], "111")).toEqual(["abc-111"]);
    expect(filterBrokerageIds(["abc-111"], "")).toEqual(["abc-111"]);
  });
});
