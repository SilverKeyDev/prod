import { apiGet, apiPatch } from "packages/services/http";
import type { components } from "packages/types/api.generated";

export type ClientSettings = components["schemas"]["ClientSettings"];
export type ClientSettingsResponse = components["schemas"]["ClientSettingsResponse"];

export const clientSettingsApi = {
  get: (): Promise<ClientSettingsResponse> =>
    apiGet<ClientSettingsResponse>("/api/v1/user/client-settings"),

  patch: (partial: Partial<ClientSettings>): Promise<ClientSettingsResponse> =>
    apiPatch<ClientSettingsResponse>("/api/v1/user/client-settings", partial),
};
