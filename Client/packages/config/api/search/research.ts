import { log, LOG_CATEGORIES } from "logger";

import { getEnv } from "packages/config/env";
import { apiGet, apiPost } from "packages/services/http/compatibility";
import { getFetch } from "packages/utils/core/platform";

// Types for research API
export type PropertyRequest = {
  address: string;
  zpid?: string;
  property_url?: string;
};

export type PropertyResponse = {
  success: boolean;
  query?: unknown;
  data?: unknown;
  features?: unknown;
  commute_data?: unknown;
  property_analysis?: unknown;
  image_features?: unknown;
  images?: string[];
  error?: string;
};

export type TaskStatusResponse = {
  success: boolean;
  task_id: string;
  status: "SUCCESS" | "PENDING" | "PROGRESS" | "FAILURE";
  result?: unknown;
  meta?: unknown;
  message?: string;
  error?: string;
  status_code?: number;
  elapsed_time?: number;
};

/**
 * Research API client using centralized utilities
 * Handles property research endpoints
 */
export const researchApi = {
  /**
   * Get property details via address using RapidAPI
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
          imagesCount: Array.isArray(resp?.images)
            ? resp?.images?.length
            : undefined,
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
    data: PropertyRequest,
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
                },
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
    data: PropertyRequest,
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
                },
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
