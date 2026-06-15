import { describe, expect, it } from "vitest";

import { defaultClientSettings } from "./defaultClientSettings";
import {
  deepMergeRecords,
  hydrateClientSettings,
  mergeClientSettingsDeep,
} from "./mergeClientSettings";

describe("mergeClientSettings", () => {
  it("hydrates missing keys from defaults", () => {
    const h = hydrateClientSettings({});
    expect(h.library?.homes?.layout).toBe("grid");
    expect(h.calendar?.shell).toBe("month");
  });

  it("deep merges nested library patch", () => {
    const base = defaultClientSettings();
    const next = mergeClientSettingsDeep(base, {
      library: { homes: { layout: "list" } },
    });
    expect(next.library?.homes?.layout).toBe("list");
    expect(next.library?.homes?.sort).toBe("date_desc");
  });

  it("deepMergeRecords removes keys when patch value is null", () => {
    const out = deepMergeRecords(
      { a: 1, b: { c: 2 } },
      { b: null as unknown as Record<string, unknown> }
    );
    expect(out).toEqual({ a: 1 });
  });
});
