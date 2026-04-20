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

import { apiRequest, apiUpload } from "packages/services/http/compatibility";
import type { components } from "packages/types/api.generated";
import { createBlob, getDocument } from "packages/utils/platform";

// Re-export type from generated schema
export type UploadResponse = components["schemas"]["UploadResponse"];

/**
 * Secure Upload API client using centralized utilities
 */
export const secureUploadApi = {
  /**
   * Upload a document file
   */
  uploadDocument: (file: File, metadata?: Record<string, unknown>): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    if (metadata) {
      formData.append("metadata", JSON.stringify(metadata));
    }
    return apiUpload<UploadResponse>("/api/v1/upload/document", formData);
  },

  /**
   * Upload an image file
   */
  uploadImage: (file: File, metadata?: Record<string, unknown>): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    if (metadata) {
      formData.append("metadata", JSON.stringify(metadata));
    }
    return apiUpload<UploadResponse>("/api/v1/upload/image", formData);
  },

  /**
   * Download a document by ID
   */
  downloadDocument: async (docId: string): Promise<void> => {
    const response = await apiRequest(`/api/v1/documents/${docId}/download`, {
      method: "GET",
    });

    const responseData = response as {
      success: boolean;
      data?: unknown;
      filename?: string;
    };
    if (responseData.success) {
      const doc = getDocument();
      if (typeof URL !== "undefined" && doc?.body) {
        const blob = createBlob([responseData.data as BlobPart]);
        const url = URL.createObjectURL(blob);
        const a = doc.createElement("a");
        a.href = url;
        a.download = responseData.filename ?? "document";
        doc.body.appendChild(a);
        a.click();
        doc.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  },

  /**
   * Delete a document by ID
   */
  deleteDocument: (docId: string): Promise<{ success: boolean; error?: string }> =>
    apiRequest<{ success: boolean; error?: string }>(`/api/v1/documents/${docId}`, {
      method: "DELETE",
    }),
};
