import { describe, expect, it } from "vitest";

import { migrateFiltersStorePersisted } from "./filters.slice.migrate";

describe("migrateFiltersStorePersisted", () => {
  it("applies default sort direction when persisted direction is invalid (v6)", () => {
    const result = migrateFiltersStorePersisted(
      {
        resultsOrderBy: "price",
        resultsSortDirection: "invalid",
      },
      6
    );
    expect(result.resultsOrderBy).toBe("price");
    expect(result.resultsSortDirection).toBe("asc");
  });

  it("keeps valid persisted sort direction at v7", () => {
    const result = migrateFiltersStorePersisted(
      {
        resultsOrderBy: "match_score",
        resultsSortDirection: "asc",
      },
      7
    );
    expect(result.resultsOrderBy).toBe("match_score");
    expect(result.resultsSortDirection).toBe("asc");
  });
});
