import { beforeEach, describe, expect, it, vi } from "vitest";

import { reportApi } from "packages/api";

vi.mock("packages/services/http/compatibility", () => ({
  apiGet: vi.fn(),
}));

import { apiGet } from "packages/services/http/compatibility";

describe("reportApi.getDocumentLibrary", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
  });

  it("calls document-library endpoint without client_id", async () => {
    vi.mocked(apiGet).mockResolvedValue({ success: true, items: [], count: 0 });
    await reportApi.getDocumentLibrary();
    expect(apiGet).toHaveBeenCalledWith("/api/v1/report/document-library");
  });

  it("passes client_id query param when provided", async () => {
    vi.mocked(apiGet).mockResolvedValue({ success: true, items: [], count: 0 });
    await reportApi.getDocumentLibrary("client-uuid");
    expect(apiGet).toHaveBeenCalledWith(
      "/api/v1/report/document-library?client_id=client-uuid",
    );
  });
});
