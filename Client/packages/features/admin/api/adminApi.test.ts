import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("packages/services/http/compatibility", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

import { apiGet, apiPost } from "packages/services/http/compatibility";

import { adminApi } from "./admin";

describe("adminApi", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
    vi.mocked(apiPost).mockReset();
  });

  describe("getLoggerConfig", () => {
    it("returns config on success", async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        success: true,
        config: { logLevel: "INFO" },
      });
      await expect(adminApi.getLoggerConfig()).resolves.toEqual({ logLevel: "INFO" });
      expect(apiGet).toHaveBeenCalledWith("/api/v1/admin/logger-config");
    });

    it("throws when success is false", async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ success: false, error: "nope" });
      await expect(adminApi.getLoggerConfig()).rejects.toThrow("nope");
    });
  });

  describe("updateLoggerConfig", () => {
    it("returns merged config on success", async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({
        success: true,
        config: { logLevel: "DEBUG" },
      });
      await expect(adminApi.updateLoggerConfig({ polling: true })).resolves.toEqual({
        logLevel: "DEBUG",
      });
      expect(apiPost).toHaveBeenCalledWith("/api/v1/admin/logger-config", {
        updates: { polling: true },
      });
    });
  });

  describe("docusignOAuthStart", () => {
    it("returns auth_url on success", async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        success: true,
        auth_url: "https://example.test/oauth",
      });
      await expect(adminApi.docusignOAuthStart()).resolves.toEqual({
        auth_url: "https://example.test/oauth",
      });
    });

    it("throws when auth_url missing", async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ success: true });
      await expect(adminApi.docusignOAuthStart()).rejects.toThrow();
    });
  });

  describe("docusignListTemplates", () => {
    it("returns templates array", async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        success: true,
        templates: [{ id: "t1" }],
      });
      await expect(adminApi.docusignListTemplates()).resolves.toEqual([{ id: "t1" }]);
    });
  });

  describe("docusignSyncTemplates", () => {
    it("returns task_id on success", async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({
        success: true,
        task_id: "celery-123",
      });
      await expect(adminApi.docusignSyncTemplates()).resolves.toEqual({ task_id: "celery-123" });
      expect(apiPost).toHaveBeenCalledWith(
        "/api/v1/docusign/templates/sync",
        {},
        { acceptStatuses: [202] }
      );
    });
  });

  describe("deleteUserById", () => {
    it("trims user id and returns deleted_user_id", async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({
        success: true,
        deleted_user_id: "abc",
      });
      await expect(adminApi.deleteUserById("  abc  ")).resolves.toEqual({
        deleted_user_id: "abc",
      });
      expect(apiPost).toHaveBeenCalledWith("/api/v1/admin/users/delete", {
        user_id: "abc",
        confirm: true,
      });
    });

    it("throws when response invalid", async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ success: false });
      await expect(adminApi.deleteUserById("x")).rejects.toThrow();
    });
  });

  describe("updateUserSystemRoles", () => {
    it("returns user_id and gate_roles", async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({
        success: true,
        user_id: "u1",
        gate_roles: ["admin"],
      });
      await expect(
        adminApi.updateUserSystemRoles({
          user_id: "u1",
          grant: ["admin"],
          revoke: [],
        })
      ).resolves.toEqual({ user_id: "u1", gate_roles: ["admin"] });
    });
  });

  describe("resetDevUserData", () => {
    it("posts confirm and scopes for self", async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({
        success: true,
        target_user_id: "u1",
        cleared: { preferences: true },
      });
      await expect(adminApi.resetDevUserData({ scopes: ["preferences"] })).resolves.toEqual({
        target_user_id: "u1",
        cleared: { preferences: true },
      });
      expect(apiPost).toHaveBeenCalledWith("/api/v1/admin/users/reset-dev-data", {
        confirm: true,
        scopes: ["preferences"],
      });
    });

    it("includes user_id when superadmin targets another user", async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({
        success: true,
        target_user_id: "other",
        cleared: { profile: true },
      });
      await adminApi.resetDevUserData({
        scopes: ["profile"],
        userId: "  other  ",
      });
      expect(apiPost).toHaveBeenCalledWith("/api/v1/admin/users/reset-dev-data", {
        confirm: true,
        scopes: ["profile"],
        user_id: "other",
      });
    });
  });

  describe("setCurrentUserAgentStatus", () => {
    it("returns user on success", async () => {
      const user = { id: "u1", email: "a@b.c", name: "A", is_active: true, is_agent: true };
      vi.mocked(apiPost).mockResolvedValueOnce({
        success: true,
        user,
      });
      await expect(adminApi.setCurrentUserAgentStatus({ is_agent: true })).resolves.toEqual(user);
      expect(apiPost).toHaveBeenCalledWith("/api/v1/admin/current-user-agent-status", {
        is_agent: true,
      });
    });

    it("throws with server error string when present", async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({
        success: false,
        error: "Forbidden",
      });
      await expect(adminApi.setCurrentUserAgentStatus({ is_agent: false })).rejects.toThrow(
        "Forbidden"
      );
    });
  });
});
