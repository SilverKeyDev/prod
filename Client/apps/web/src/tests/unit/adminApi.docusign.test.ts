import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiGet, apiPost } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("packages/services/http/compatibility", () => ({
  apiGet,
  apiPost,
  apiDelete: vi.fn(),
  apiDownloadBlob: vi.fn(),
  apiPatch: vi.fn(),
  apiPut: vi.fn(),
  apiRequest: vi.fn(),
  apiUpload: vi.fn(),
}));

import { adminApi } from "packages/api/admin";

describe("adminApi DocuSign diagnostics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("docusignOAuthStart returns auth_url from response", async () => {
    apiGet.mockResolvedValue({
      success: true,
      auth_url: "https://account-d.docusign.com/oauth?x=1",
    });
    await expect(adminApi.docusignOAuthStart()).resolves.toEqual({
      auth_url: "https://account-d.docusign.com/oauth?x=1",
    });
    expect(apiGet).toHaveBeenCalledWith("/api/v1/docusign/oauth/start");
  });

  it("docusignListTemplates maps templates array", async () => {
    apiGet.mockResolvedValue({
      success: true,
      templates: [{ id: "t1", name: "Offer", is_active: true }],
    });
    await expect(adminApi.docusignListTemplates()).resolves.toEqual([
      { id: "t1", name: "Offer", is_active: true },
    ]);
    expect(apiGet).toHaveBeenCalledWith("/api/v1/docusign/templates");
  });

  it("docusignSyncTemplates accepts 202 and returns task_id", async () => {
    apiPost.mockResolvedValue({ success: true, task_id: "celery-task-123" });
    await expect(adminApi.docusignSyncTemplates()).resolves.toEqual({
      task_id: "celery-task-123",
    });
    expect(apiPost).toHaveBeenCalledWith(
      "/api/v1/docusign/templates/sync",
      {},
      { acceptStatuses: [202] },
    );
  });
});
