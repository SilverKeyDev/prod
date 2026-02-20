/**
 * Health check API using centralized HTTP client.
 */
import { apiGet } from "packages/services/http/compatibility";

export type HealthResponse = {
  status?: string;
  [key: string]: unknown;
};

export const healthApi = {
  get: (): Promise<HealthResponse> => apiGet<HealthResponse>("/healthz"),
};
