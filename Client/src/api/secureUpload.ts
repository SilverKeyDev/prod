import { apiUpload, apiRequest } from './utils/index';

// Types for secure upload API
export interface UploadResponse {
  success: boolean;
  file_id?: string;
  file_url?: string;
  filename?: string;
  file_size?: number;
  content_type?: string;
  message?: string;
  error?: string;
}

/**
 * Secure Upload API client using centralized utilities
 */
export const secureUploadApi = {
  /**
   * Upload a document file
   */
  uploadDocument: (file: File, metadata?: Record<string, unknown>): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    return apiUpload<UploadResponse>('/api/v1/upload/document', formData);
  },

  /**
   * Upload an image file
   */
  uploadImage: (file: File, metadata?: Record<string, unknown>): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    return apiUpload<UploadResponse>('/api/v1/upload/image', formData);
  },

  /**
   * Download a document by ID
   */
  downloadDocument: async (docId: string): Promise<void> => {
    const response = await apiRequest(`/api/v1/documents/${docId}/download`, {
      method: 'GET',
    });
    
    if (response.success) {
      // Handle blob download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.filename || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  },

  /**
   * Delete a document by ID
   */
  deleteDocument: (docId: string): Promise<{ success: boolean; error?: string }> =>
    apiRequest<{ success: boolean; error?: string }>(`/api/v1/documents/${docId}`, {
      method: 'DELETE',
    }),
};