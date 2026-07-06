import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("packages/services/http", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiDelete, apiGet, apiPost, apiPut } from "packages/services/http";
import { HttpError } from "packages/services/http/client";

import { skyslopeCredentialsApi } from "./skyslopeCredentials";

describe("skyslopeCredentialsApi", () => {
  const brokerageId = "org-123";

  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
    vi.mocked(apiPost).mockReset();
    vi.mocked(apiPut).mockReset();
    vi.mocked(apiDelete).mockReset();
  });

  it("getCredential returns data on success", async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      success: true,
      data: {
        brokerage_id: brokerageId,
        provider: "skyslope",
        status: "active",
        key_last4: "9999",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    });

    await expect(skyslopeCredentialsApi.getCredential(brokerageId)).resolves.toMatchObject({
      brokerage_id: brokerageId,
      key_last4: "9999",
    });
    expect(apiGet).toHaveBeenCalledWith("/api/v1/admin/brokerages/org-123/integrations/skyslope");
  });

  it("getCredential returns null on 404", async () => {
    vi.mocked(apiGet).mockRejectedValueOnce(new HttpError(404, "/test", "not found", {}));
    await expect(skyslopeCredentialsApi.getCredential(brokerageId)).resolves.toBeNull();
  });

  it("createCredential posts payload", async () => {
    vi.mocked(apiPost).mockResolvedValueOnce({
      success: true,
      data: { brokerage_id: brokerageId, provider: "skyslope", status: "pending" },
    });

    await skyslopeCredentialsApi.createCredential(brokerageId, {
      api_key: "key",
      access_secret: "secret",
    });

    expect(apiPost).toHaveBeenCalledWith("/api/v1/admin/brokerages/org-123/integrations/skyslope", {
      api_key: "key",
      access_secret: "secret",
    });
  });

  it("updateCredential puts payload", async () => {
    vi.mocked(apiPut).mockResolvedValueOnce({
      success: true,
      data: { brokerage_id: brokerageId, provider: "skyslope", status: "active" },
    });

    await skyslopeCredentialsApi.updateCredential(brokerageId, { api_key: "rotated" });
    expect(apiPut).toHaveBeenCalledWith("/api/v1/admin/brokerages/org-123/integrations/skyslope", {
      api_key: "rotated",
    });
  });

  it("deleteCredential calls delete endpoint", async () => {
    vi.mocked(apiDelete).mockResolvedValueOnce({ success: true });
    await skyslopeCredentialsApi.deleteCredential(brokerageId);
    expect(apiDelete).toHaveBeenCalledWith(
      "/api/v1/admin/brokerages/org-123/integrations/skyslope"
    );
  });

  it("testConnection posts to test-connection", async () => {
    vi.mocked(apiPost).mockResolvedValueOnce({
      success: true,
      message: "SkySlope connection successful.",
    });

    await expect(skyslopeCredentialsApi.testConnection(brokerageId)).resolves.toEqual({
      success: true,
      message: "SkySlope connection successful.",
    });
    expect(apiPost).toHaveBeenCalledWith(
      "/api/v1/admin/brokerages/org-123/integrations/skyslope/test-connection",
      {}
    );
  });
});
