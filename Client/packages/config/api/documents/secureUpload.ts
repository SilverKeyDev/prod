import { apiUpload, apiRequest } from "../../../services/http/compatibility";

// Types for secure upload API
export type UploadResponse = {
  success: boolean;
  message?: string;
  error?: string;
  // Backend returns document nested in response
  document?: {
    id: string;
    filename: string;
    size: number;
    type: string;
    hash?: string;
    uploaded_at?: string;
  };
  // Legacy fields for backward compatibility
  file_id?: string;
  file_url?: string;
  filename?: string;
  file_size?: number;
  content_type?: string;
};

/**
 * Secure Upload API client using centralized utilities
 */
export const secureUploadApi = {
  /**
   * Upload a document file
   * @param file - The file to upload
   * @param address - Optional address associated with the document
   */
  uploadDocument: (file: File, address?: string): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    if (address) {
      formData.append("address", address);
    }
    return apiUpload<UploadResponse>("/api/v1/upload/document", formData);
  },

  /**
   * Upload an image file
   */
  uploadImage: (
    file: File,
    metadata?: Record<string, unknown>,
  ): Promise<UploadResponse> => {
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
      // Handle blob download
      const blob = new Blob([responseData.data as BlobPart]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = responseData.filename ?? "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  },

  /**
   * Delete a document by ID
   */
  deleteDocument: (
    docId: string,
  ): Promise<{ success: boolean; error?: string }> =>
    apiRequest<{ success: boolean; error?: string }>(
      `/api/v1/documents/${docId}`,
      {
        method: "DELETE",
      },
    ),
};
