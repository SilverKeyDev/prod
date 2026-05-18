/**
 * MIGRATION SHIM (DO NOT ADD NEW TYPES HERE)
 *
 * This file re-exports types from the generated API contract (api.generated.ts).
 * All type definitions have been moved to openapi.yaml.
 *
 * To add/modify API types:
 * 1. Edit openapi.yaml
 * 2. Run `pnpm generate:api-types`
 * 3. Types will be auto-generated in packages/types/api.generated.ts
 *
 * This shim maintains backward compatibility for existing imports.
 */

import { apiGet, apiPost } from "packages/services/http/compatibility";
import type { components } from "packages/types/api.generated";

// Re-export types from generated schema
export type ServerLoggerConfig = components["schemas"]["ServerLoggerConfig"];
export type DocusignOAuthStartResponse = components["schemas"]["DocusignOAuthStartResponse"];
export type DocusignListTemplatesResponse = components["schemas"]["DocusignListTemplatesResponse"];
export type DocusignSyncTemplatesResponse = components["schemas"]["DocusignSyncTemplatesResponse"];
export type DeleteUserResponse = components["schemas"]["DeleteUserResponse"];
export type DocusignTemplateListItem = components["schemas"]["DocusignTemplateListItem"];

/** Narrowed success payloads derived from OpenAPI response schemas (field names match the wire contract). */
export type DocusignOAuthStartResult = Required<
  Pick<components["schemas"]["DocusignOAuthStartResponse"], "auth_url">
>;
export type DocusignSyncTemplatesResult = Required<
  Pick<components["schemas"]["DocusignSyncTemplatesResponse"], "task_id">
>;
export type DeleteUserByIdResult = Required<
  Pick<components["schemas"]["DeleteUserResponse"], "deleted_user_id">
>;

export type UpdateUserSystemRolesRequest = components["schemas"]["UpdateUserSystemRolesRequest"];
export type UpdateUserSystemRolesResponse = components["schemas"]["UpdateUserSystemRolesResponse"];

export type UpdateUserSystemRolesResult = Required<
  Pick<components["schemas"]["UpdateUserSystemRolesResponse"], "user_id" | "gate_roles">
>;

export type UpdateAgentStatusRequest = components["schemas"]["UpdateAgentStatusRequest"];
export type UpdateAgentStatusResponse = components["schemas"]["UpdateAgentStatusResponse"];

export type DevUserDataResetRequest = components["schemas"]["DevUserDataResetRequest"];
export type DevUserDataResetResponse = components["schemas"]["DevUserDataResetResponse"];
export type DevUserDataResetScope = DevUserDataResetRequest["scopes"][number];

export type DevUserDataResetResult = Required<
  Pick<DevUserDataResetResponse, "target_user_id" | "cleared">
>;

type GetLoggerConfigResponse = components["schemas"]["GetLoggerConfigResponse"];
type UpdateLoggerConfigRequest = components["schemas"]["UpdateLoggerConfigRequest"];
type UpdateLoggerConfigResponse = GetLoggerConfigResponse;

export const adminApi = {
  getLoggerConfig: async (): Promise<ServerLoggerConfig> => {
    const response = await apiGet<GetLoggerConfigResponse>("/api/v1/admin/logger-config");
    if (!response.success || !response.config) {
      throw new Error(response.error ?? "Failed to fetch logger config");
    }
    return response.config;
  },

  updateLoggerConfig: async (updates: Partial<ServerLoggerConfig>): Promise<ServerLoggerConfig> => {
    const response = await apiPost<UpdateLoggerConfigResponse, UpdateLoggerConfigRequest>(
      "/api/v1/admin/logger-config",
      { updates }
    );
    if (!response.success || !response.config) {
      throw new Error(response.error ?? "Failed to update logger config");
    }
    return response.config;
  },

  /**
   * DocuSign OAuth start (agent only). Returns authorize URL for the agent to complete in browser.
   */
  docusignOAuthStart: async (): Promise<DocusignOAuthStartResult> => {
    const response = await apiGet<DocusignOAuthStartResponse>("/api/v1/docusign/oauth/start");
    if (!response.success || typeof response.auth_url !== "string") {
      throw new Error(
        typeof response.error === "string" ? response.error : "DocuSign OAuth start failed"
      );
    }
    return { auth_url: response.auth_url };
  },

  /** List synced DocuSign templates (agent only). */
  docusignListTemplates: async (): Promise<DocusignTemplateListItem[]> => {
    const response = await apiGet<DocusignListTemplatesResponse>("/api/v1/docusign/templates");
    if (!response.success || !Array.isArray(response.templates)) {
      throw new Error(
        typeof response.error === "string" ? response.error : "Failed to list DocuSign templates"
      );
    }
    return response.templates;
  },

  /** Queue background template sync (agent only). Requires Celery worker. */
  docusignSyncTemplates: async (): Promise<DocusignSyncTemplatesResult> => {
    const response = await apiPost<DocusignSyncTemplatesResponse>(
      "/api/v1/docusign/templates/sync",
      {},
      { acceptStatuses: [202] }
    );
    if (!response.success || typeof response.task_id !== "string") {
      throw new Error(
        typeof response.error === "string" ? response.error : "DocuSign template sync failed"
      );
    }
    return { task_id: response.task_id };
  },

  /**
   * Hard-delete a user and related DB rows (admin only). Sends confirm: true.
   * Non-2xx responses throw HttpError with parsed body.
   */
  deleteUserById: async (userId: string): Promise<DeleteUserByIdResult> => {
    const response = await apiPost<DeleteUserResponse>("/api/v1/admin/users/delete", {
      user_id: userId.trim(),
      confirm: true,
    });
    if (!response.success || typeof response.deleted_user_id !== "string") {
      throw new Error(response.error ?? "Failed to delete user");
    }
    return { deleted_user_id: response.deleted_user_id };
  },

  /** Super_admin only — adjust `admin` / `super_admin` entries in `user_roles`. */
  updateUserSystemRoles: async (
    body: UpdateUserSystemRolesRequest
  ): Promise<UpdateUserSystemRolesResult> => {
    const response = await apiPost<UpdateUserSystemRolesResponse, UpdateUserSystemRolesRequest>(
      "/api/v1/admin/users/roles",
      body
    );
    if (
      !response.success ||
      typeof response.user_id !== "string" ||
      !Array.isArray(response.gate_roles)
    ) {
      throw new Error(
        typeof response.error === "string" ? response.error : "Failed to update roles"
      );
    }
    return { user_id: response.user_id, gate_roles: response.gate_roles };
  },

  /**
   * Admin only — sets the signed-in user's `users.is_agent` (testing / dev persona).
   * Returns the updated user row from the server.
   */
  setCurrentUserAgentStatus: async (
    body: UpdateAgentStatusRequest
  ): Promise<NonNullable<UpdateAgentStatusResponse["user"]>> => {
    const response = await apiPost<UpdateAgentStatusResponse, UpdateAgentStatusRequest>(
      "/api/v1/admin/current-user-agent-status",
      body
    );
    if (!response.success || !response.user) {
      throw new Error(
        typeof response.error === "string" && response.error.length > 0
          ? response.error
          : "Failed to update agent status"
      );
    }
    return response.user;
  },

  /**
   * Admin only — reset scoped dev/test data (profile, preferences, DocuSign).
   * Super_admin may pass userId to target another user.
   */
  resetDevUserData: async (params: {
    scopes: DevUserDataResetScope[];
    userId?: string;
  }): Promise<DevUserDataResetResult> => {
    const body: DevUserDataResetRequest = {
      confirm: true,
      scopes: params.scopes,
    };
    const trimmedId = params.userId?.trim();
    if (trimmedId) {
      body.user_id = trimmedId;
    }
    const response = await apiPost<DevUserDataResetResponse, DevUserDataResetRequest>(
      "/api/v1/admin/users/reset-dev-data",
      body
    );
    if (
      !response.success ||
      typeof response.target_user_id !== "string" ||
      !response.cleared ||
      typeof response.cleared !== "object"
    ) {
      throw new Error(
        typeof response.error === "string" && response.error.length > 0
          ? response.error
          : "Failed to reset dev user data"
      );
    }
    return { target_user_id: response.target_user_id, cleared: response.cleared };
  },
};
