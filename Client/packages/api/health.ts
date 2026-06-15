import { apiGet } from "packages/services/http";
import type { components } from "packages/types/api.generated";

// Re-export type from generated schema
export type HealthResponse = components["schemas"]["HealthResponse"];

export const healthApi = {
  get: (): Promise<HealthResponse> => apiGet<HealthResponse>("/healthz"),
};
