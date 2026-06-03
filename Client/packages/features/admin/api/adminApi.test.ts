import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("packages/services/http", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

import { apiGet, apiPost } from "packages/services/http";

import { adminApi } from "./admin";

describe("adminApi", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
    vi.mocked(apiPost).mockReset();
  });

  describe("getLoggerConfig", () => {
    it("returns config on success", async () => {
      const deployment = {
        client: { logLevel: "ERROR", errors: true, security: true },
        server: { logLevel: "INFO", errors: true, security: true },
      };
      vi.mocked(apiGet).mockResolvedValueOnce({
        success: true,
        config: deployment,
      });
      await expect(adminApi.getLoggerConfig()).resolves.toEqual(deployment);
      expect(apiGet).toHaveBeenCalledWith("/api/v1/admin/logger-config");
    });

    it("throws when success is false", async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        success: false,
        error: "LOGGER_CONFIG_UNAVAILABLE",
        message: "Logger config unavailable",
      });
      await expect(adminApi.getLoggerConfig()).rejects.toThrow("Logger config unavailable");
    });

    it("uses fallback when success is false and error is not user-facing", async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ success: false, error: "nope" });
      await expect(adminApi.getLoggerConfig()).rejects.toThrow("Failed to fetch logger config");
    });
  });

  describe("updateLoggerConfig", () => {
    it("returns merged config on success", async () => {
      const deployment = {
        client: { logLevel: "ERROR", errors: true, security: true },
        server: { logLevel: "DEBUG", errors: true, security: true },
      };
      vi.mocked(apiPost).mockResolvedValueOnce({
        success: true,
        config: deployment,
      });
      await expect(adminApi.updateLoggerConfig({ server: { polling: true } })).resolves.toEqual(
        deployment
      );
      expect(apiPost).toHaveBeenCalledWith("/api/v1/admin/logger-config", {
        updates: { server: { polling: true } },
      });
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

  describe("listGateRoleUsers", () => {
    it("returns admins on success", async () => {
      const admins = [
        {
          user_id: "u1",
          email: "a@b.c",
          name: "Alice",
          gate_roles: ["admin"],
        },
      ];
      vi.mocked(apiGet).mockResolvedValueOnce({
        success: true,
        admins,
      });
      await expect(adminApi.listGateRoleUsers()).resolves.toEqual({ admins });
      expect(apiGet).toHaveBeenCalledWith("/api/v1/admin/users/gate-roles");
    });

    it("throws when response invalid", async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ success: false });
      await expect(adminApi.listGateRoleUsers()).rejects.toThrow();
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

    it("accepts extended scope enum values", async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({
        success: true,
        target_user_id: "u1",
        cleared: { s3: true, connections: true },
      });
      await adminApi.resetDevUserData({
        scopes: ["s3", "connections"],
      });
      expect(apiPost).toHaveBeenCalledWith("/api/v1/admin/users/reset-dev-data", {
        confirm: true,
        scopes: ["s3", "connections"],
      });
    });
  });

  describe("setCurrentUserAgentStatus", () => {
    it("returns user on success", async () => {
      const user = { id: "u1", email: "a@b.c", name: "A", is_active: true, roles: ["agent"] };
      vi.mocked(apiPost).mockResolvedValueOnce({
        success: true,
        user,
      });
      await expect(
        adminApi.setCurrentUserAgentStatus({ agent_role_enabled: true })
      ).resolves.toEqual(user);
      expect(apiPost).toHaveBeenCalledWith("/api/v1/admin/current-user-agent-status", {
        agent_role_enabled: true,
      });
    });

    it("throws with server error string when present", async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({
        success: false,
        error: "Forbidden",
      });
      await expect(
        adminApi.setCurrentUserAgentStatus({ agent_role_enabled: false })
      ).rejects.toThrow("Forbidden");
    });
  });

  describe("setCurrentUserDevWorkspace", () => {
    it("returns user on success", async () => {
      const user = {
        id: "u1",
        email: "a@b.c",
        name: "A",
        is_active: true,
        roles: ["seller"],
      };
      vi.mocked(apiPost).mockResolvedValueOnce({
        success: true,
        user,
      });
      await expect(adminApi.setCurrentUserDevWorkspace({ workspace: "seller" })).resolves.toEqual(
        user
      );
      expect(apiPost).toHaveBeenCalledWith("/api/v1/admin/current-user-dev-workspace", {
        workspace: "seller",
      });
    });

    it("throws with server error string when present", async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({
        success: false,
        error: "Forbidden",
      });
      await expect(adminApi.setCurrentUserDevWorkspace({ workspace: "buyer" })).rejects.toThrow(
        "Forbidden"
      );
    });
  });
});
