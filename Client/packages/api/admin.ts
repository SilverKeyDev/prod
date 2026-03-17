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
};
