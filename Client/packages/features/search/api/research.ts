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

import { getEnv } from "packages/config/env";
import { log, LOG_CATEGORIES } from "packages/logger";
import { apiGet, apiPost } from "packages/services/http/compatibility";
import type { components } from "packages/types/api.generated";
import { getFetch } from "packages/utils/platform";

// Re-export types from generated schema
export type PropertyResearchOptions = components["schemas"]["PropertyResearchOptions"];
export type PropertyRequest = components["schemas"]["PropertyRequest"];
export type PropertyResponse = components["schemas"]["PropertyResponse"];
export type TaskStatusResponse = components["schemas"]["TaskStatusResponse"];

/**
 * Research API client using centralized utilities
 * Handles property research endpoints
 */
export const researchApi = {
  /**
   * Get property details via address
   */
  getProperty: (data: PropertyRequest): Promise<PropertyResponse> => {
    const url = "/api/v1/research/property";
    return apiPost<PropertyResponse>(url, data, {
      timeout: 300000, // 5 minutes for property search
    })
      .then((resp) => {
        log.debug(LOG_CATEGORIES.API, "getProperty response", {
          success: resp?.success,
          hasData: !!resp?.data,
          hasFeatures: !!resp?.features,
          hasCommute: !!resp?.commute_data,
          hasAnalysis: !!resp?.property_analysis,
          imagesCount: Array.isArray(resp?.images) ? resp?.images?.length : undefined,
          hasError: !!resp?.error,
        });
        return resp;
      })
      .catch((error) => {
        log.error(LOG_CATEGORIES.ERRORS, "getProperty error", {
          message: String(error),
        });
        throw error;
      });
  },

  /**
   * Stream property details progressively using Server-Sent Events (SSE)
   * Returns an async generator that yields property updates as sections are generated
   */
  streamProperty: async function* (
    data: PropertyRequest
  ): AsyncGenerator<{ type: string; data: unknown }, void, unknown> {
    const baseUrl = getEnv().apiBaseUrl;
    const url = `${baseUrl}/api/v1/research/property?stream=true`;
    const fetchFn = getFetch();

    const response = await fetchFn(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stream failed: ${response.status} ${errorText}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(6); // Remove "data: " prefix
              const update = JSON.parse(jsonStr);
              log.debug(LOG_CATEGORIES.API, "streamProperty received update", {
                type: update.type,
                hasData: !!update.data,
              });

              yield update;
            } catch (parseError) {
              log.error(
                LOG_CATEGORIES.ERRORS,
                "❌ [researchApi.streamProperty] Failed to parse SSE data",
                {
                  line,
                  error: parseError,
                }
              );
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  /**
   * Compare property (without pros/cons generation)
   */
  compareProperty: (data: PropertyRequest): Promise<PropertyResponse> => {
    const url = "/api/v1/research/compare";
    return apiPost<PropertyResponse>(url, data, {
      timeout: 300000, // 5 minutes for property comparison
    })
      .then((resp) => {
        log.debug(LOG_CATEGORIES.API, "compareProperty response", {
          success: resp?.success,
          hasData: !!resp?.data,
          hasError: !!resp?.error,
        });
        return resp;
      })
      .catch((error) => {
        log.error(LOG_CATEGORIES.ERRORS, "compareProperty error", {
          message: String(error),
        });
        throw error;
      });
  },

  /**
   * Stream property details for comparison (without pros/cons generation)
   * Returns an async generator that yields property updates as sections are generated
   */
  streamCompare: async function* (
    data: PropertyRequest
  ): AsyncGenerator<{ type: string; data: unknown }, void, unknown> {
    const baseUrl = getEnv().apiBaseUrl;
    const url = `${baseUrl}/api/v1/research/compare?stream=true`;
    const fetchFn = getFetch();

    const response = await fetchFn(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stream failed: ${response.status} ${errorText}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(6); // Remove "data: " prefix
              const update = JSON.parse(jsonStr);
              log.debug(LOG_CATEGORIES.API, "streamCompare received update", {
                type: update.type,
                hasData: !!update.data,
              });

              yield update;
            } catch (parseError) {
              log.error(
                LOG_CATEGORIES.ERRORS,
                "❌ [researchApi.streamCompare] Failed to parse SSE data",
                {
                  line,
                  error: parseError,
                }
              );
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  /**
   * Get the status of a research task (property or compare)
   */
  getTaskStatus: (taskId: string): Promise<TaskStatusResponse> => {
    const url = `/api/v1/research/task-status/${taskId}`;
    return apiGet<TaskStatusResponse>(url, {
      timeout: 30000, // 30 seconds for task status check
    })
      .then((resp) => {
        log.debug(LOG_CATEGORIES.API, "getTaskStatus response", {
          success: resp?.success,
          status: resp?.status,
          taskId: resp?.task_id,
        });
        return resp;
      })
      .catch((error) => {
        log.error(LOG_CATEGORIES.ERRORS, "getTaskStatus error", {
          message: String(error),
        });
        throw error;
      });
  },
};
