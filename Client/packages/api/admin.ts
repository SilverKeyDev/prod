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
};
