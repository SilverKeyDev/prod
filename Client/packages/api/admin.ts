import { apiGet, apiPost } from "packages/services/http/compatibility";

export type ServerLoggerConfig = {
  polling: boolean;
  pages: boolean;
  hooks: boolean;
  auth: boolean;
  http: boolean;
  api: boolean;
  errors: boolean;
  security: boolean;
  logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
  [key: string]: boolean | string | undefined;
};

type GetLoggerConfigResponse = {
  success: boolean;
  config?: ServerLoggerConfig;
  error?: string;
};

type UpdateLoggerConfigRequest = {
  updates: Partial<ServerLoggerConfig>;
};

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

  getSkyslopeStatus: async (): Promise<{ connected: boolean }> => {
    const response = await apiGet<{ connected: boolean }>("/api/v1/skyslope/status");
    return { connected: response.connected ?? false };
  },

  /** Set the currently signed-in user's agent status (admin only). */
  setCurrentUserAgentStatus: async (isAgent: boolean): Promise<{ is_agent: boolean }> => {
    const response = await apiPost<{ success: boolean; is_agent?: boolean }, { is_agent: boolean }>(
      "/api/v1/admin/current-user-agent-status",
      { is_agent: isAgent }
    );
    if (!response.success || typeof response.is_agent !== "boolean") {
      throw new Error("Failed to update agent status");
    }
    return { is_agent: response.is_agent };
  },

  /**
   * Hard-delete a user and related DB rows (admin only). Sends confirm: true.
   * Non-2xx responses throw HttpError with parsed body.
   */
  deleteUserById: async (userId: string): Promise<{ deleted_user_id: string }> => {
    type DeleteUserResponse = {
      success?: boolean;
      deleted_user_id?: string;
      error?: string;
      message?: string;
    };
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
