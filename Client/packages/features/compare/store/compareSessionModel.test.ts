import { describe, expect, it } from "vitest";

import { clearedRowsAfterCompareModalClose } from "./compareSessionModel";

describe("compareSessionModel", () => {
  it("clearedRowsAfterCompareModalClose returns empty row session", () => {
    expect(clearedRowsAfterCompareModalClose()).toEqual({
      omittedRowKeys: [],
      manuallyEnabledRowKeys: [],
      isManageRowsModalOpen: false,
    });
  });
});
