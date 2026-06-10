import { apiGet, apiPost } from "packages/services/http";
import { buildApiUrl } from "packages/services/http/urlHelpers";
import type { components } from "packages/types/api.generated";
import { resolveApiResultErrorMessage } from "packages/utils/core/errorHandling";

// Re-export types from generated schema
export type ServerLoggerConfig = components["schemas"]["ServerLoggerConfig"];
export type ClientLoggerConfig = components["schemas"]["ClientLoggerConfig"];
export type DeploymentLoggerConfig = components["schemas"]["DeploymentLoggerConfig"];
export type DeploymentLoggerConfigUpdates = components["schemas"]["DeploymentLoggerConfigUpdates"];
export type DeleteUserResponse = components["schemas"]["DeleteUserResponse"];

/** Narrowed success payloads derived from OpenAPI response schemas (field names match the wire contract). */
export type DeleteUserByIdResult = Required<
  Pick<components["schemas"]["DeleteUserResponse"], "deleted_user_id">
>;

export type UpdateUserSystemRolesRequest = components["schemas"]["UpdateUserSystemRolesRequest"];
export type UpdateUserSystemRolesResponse = components["schemas"]["UpdateUserSystemRolesResponse"];

export type AdminGateUser = components["schemas"]["AdminGateUser"];
export type ListAdminGateUsersResponse = components["schemas"]["ListAdminGateUsersResponse"];

export type UpdateUserSystemRolesResult = Required<
  Pick<components["schemas"]["UpdateUserSystemRolesResponse"], "user_id" | "gate_roles">
>;

export type ListAdminGateUsersResult = Required<
  Pick<components["schemas"]["ListAdminGateUsersResponse"], "admins">
>;

export type UpdateAgentStatusRequest = components["schemas"]["UpdateAgentStatusRequest"];
export type UpdateAgentStatusResponse = components["schemas"]["UpdateAgentStatusResponse"];

export type SetCurrentUserDevWorkspaceRequest =
  components["schemas"]["SetCurrentUserDevWorkspaceRequest"];
export type SetCurrentUserDevWorkspaceResponse =
  components["schemas"]["SetCurrentUserDevWorkspaceResponse"];

export type DevAccountSessionRole = components["schemas"]["DevWorkspacePersona"];

type MintDevAccountSessionResponse = components["schemas"]["SuccessResponse"] & {
  token?: string;
  role?: string;
  user?: components["schemas"]["User"];
};

type ExchangeDevAccountSessionResponse = components["schemas"]["SuccessResponse"] & {
  access_token?: string;
  id_token?: string;
  user_sub?: string;
  user?: components["schemas"]["User"] & {
    auth_user_kind?: string;
    auth_method?: string;
  };
  verification_complete?: boolean;
};

export type MintDevAccountSessionResult = {
  token: string;
  role: string;
  user: components["schemas"]["User"];
};

export type DevUserDataResetRequest = components["schemas"]["DevUserDataResetRequest"];
export type DevUserDataResetResponse = components["schemas"]["DevUserDataResetResponse"];
export type DevUserDataResetScope = DevUserDataResetRequest["scopes"][number];

export type DevUserDataResetResult = Required<
  Pick<DevUserDataResetResponse, "target_user_id" | "cleared">
>;

export type ValidationStatsResult = Required<
  Pick<components["schemas"]["ValidationStatsApiResponse"], "data">
>;

type GetLoggerConfigResponse = components["schemas"]["GetLoggerConfigResponse"];
type UpdateLoggerConfigRequest = components["schemas"]["UpdateLoggerConfigRequest"];
type UpdateLoggerConfigResponse = GetLoggerConfigResponse;

export const adminApi = {
  getLoggerConfig: async (): Promise<DeploymentLoggerConfig> => {
    const response = await apiGet<GetLoggerConfigResponse>("/api/v1/admin/logger-config");
    if (!response.success || !response.config) {
      throw new Error(resolveApiResultErrorMessage(response, "Failed to fetch logger config"));
    }
    return response.config;
  },

  updateLoggerConfig: async (
    updates: DeploymentLoggerConfigUpdates
  ): Promise<DeploymentLoggerConfig> => {
    const response = await apiPost<UpdateLoggerConfigResponse, UpdateLoggerConfigRequest>(
      "/api/v1/admin/logger-config",
      { updates }
    );
    if (!response.success || !response.config) {
      throw new Error(resolveApiResultErrorMessage(response, "Failed to update logger config"));
    }
    return response.config;
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
      throw new Error(resolveApiResultErrorMessage(response, "Failed to delete user"));
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
      throw new Error(resolveApiResultErrorMessage(response, "Failed to update roles"));
    }
    return { user_id: response.user_id, gate_roles: response.gate_roles };
  },

  /** Super_admin only — list users with `admin` or `super_admin` gate roles. */
  listGateRoleUsers: async (): Promise<ListAdminGateUsersResult> => {
    const response = await apiGet<ListAdminGateUsersResponse>("/api/v1/admin/users/gate-roles");
    if (!response.success || !Array.isArray(response.admins)) {
      throw new Error(resolveApiResultErrorMessage(response, "Failed to list gate role users"));
    }
    return { admins: response.admins };
  },

  /**
   * Admin only — sets exclusive dev workspace persona on the signed-in user (testing / dev preview).
   * Returns the updated user row from the server.
   */
  setCurrentUserDevWorkspace: async (
    body: SetCurrentUserDevWorkspaceRequest
  ): Promise<NonNullable<SetCurrentUserDevWorkspaceResponse["user"]>> => {
    const response = await apiPost<
      SetCurrentUserDevWorkspaceResponse,
      SetCurrentUserDevWorkspaceRequest
    >("/api/v1/admin/current-user-dev-workspace", body);
    if (!response.success || !response.user) {
      throw new Error(
        resolveApiResultErrorMessage(response, "Failed to update dev workspace persona")
      );
    }
    return response.user;
  },

  /**
   * Admin only — toggles the signed-in user's agent role in user_roles (testing / dev persona).
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
      throw new Error(resolveApiResultErrorMessage(response, "Failed to update agent status"));
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
      throw new Error(resolveApiResultErrorMessage(response, "Failed to reset dev user data"));
    }
    return { target_user_id: response.target_user_id, cleared: response.cleared };
  },

  /**
   * Admin only — mint a one-time token for opening a tab-scoped dev account session.
   */
  mintDevAccountSession: async (
    body: SetCurrentUserDevWorkspaceRequest
  ): Promise<MintDevAccountSessionResult> => {
    const response = await apiPost<
      MintDevAccountSessionResponse,
      SetCurrentUserDevWorkspaceRequest
    >("/api/v1/admin/dev-accounts/session", body);
    if (
      !response.success ||
      typeof response.token !== "string" ||
      typeof response.role !== "string" ||
      !response.user
    ) {
      throw new Error(resolveApiResultErrorMessage(response, "Failed to mint dev account session"));
    }
    return { token: response.token, role: response.role, user: response.user };
  },

  /**
   * Exchange a one-time dev session token for a tab-scoped bearer session (no existing auth).
   */
  exchangeDevAccountSession: async (token: string): Promise<ExchangeDevAccountSessionResponse> => {
    return apiPost<ExchangeDevAccountSessionResponse, { token: string }>(
      "/api/v1/admin/dev-accounts/session/exchange",
      { token },
      { includeAuth: false, includeCredentials: false }
    );
  },

  /** Admin only — OpenAPI validation stats snapshot for the rolling window. */
  getValidationStats: async (days: number): Promise<ValidationStatsResult> => {
    const url = buildApiUrl("/api/v1/admin/validation-stats", { days });
    const response = await apiGet<components["schemas"]["ValidationStatsApiResponse"]>(url);
    if (!response.success || !response.data || typeof response.data !== "object") {
      throw new Error(
        resolveApiResultErrorMessage(response, "Failed to fetch validation statistics")
      );
    }
    return { data: response.data };
  },
};
