import { describe, expect, it } from "vitest";

import { filterDocumentLibraryExcludingAgreements } from "./documentLibraryFilters";

describe("filterDocumentLibraryExcludingAgreements", () => {
  it("removes items with library_kind agreement", () => {
    const rows = [
      { id: "1", library_kind: "upload" as const },
      { id: "2", library_kind: "agreement" as const },
      { id: "3", library_kind: undefined },
    ];
    expect(filterDocumentLibraryExcludingAgreements(rows)).toEqual([
      { id: "1", library_kind: "upload" },
      { id: "3", library_kind: undefined },
    ]);
  });
});
