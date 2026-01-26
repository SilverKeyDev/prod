import { dashboardApi, secureUploadApi } from "../config/api";
import type { Document, DocumentCategory } from "../schemas";
import { isDocumentData } from "../utils/typeGuards";

import { createAbortManager, isAbortError, HttpError } from "./http";
import { log, LOG_CATEGORIES } from "../../logger";

/* =========================
   Document Service
   ========================= */

export class DocumentService {
  private abortManager = createAbortManager();

  /* =========================
     Fetch Methods
     ========================= */

  async fetchDocuments(): Promise<Document[]> {
    // getDocuments should not be called - return empty array
    log.warn(LOG_CATEGORIES.API, "fetchDocuments called but getDocuments should not be used");
    return [];
  }

  fetchCategories(): Promise<DocumentCategory[]> {
    // Return default categories since server doesn't have this endpoint
    const categories: DocumentCategory[] = [
      {
        id: "report",
        name: "Report",
        description: "Property analysis reports",
        required_for: ["offer", "closing"],
      },
      {
        id: "contract",
        name: "Contract",
        description: "Purchase agreements and contracts",
        required_for: ["offer", "closing"],
      },
      {
        id: "inspection",
        name: "Inspection",
        description: "Property inspection reports",
        required_for: ["inspection", "closing"],
      },
      {
        id: "financial",
        name: "Financial",
        description: "Loan documents and financial statements",
        required_for: ["financing", "closing"],
      },
    ];
    return Promise.resolve(categories);
  }

  /* =========================
     Document Operations
     ========================= */

  async uploadDocument(
    file: File,
    category: string,
    propertyId?: string,
    offerId?: string,
    address?: string,
  ): Promise<Document> {
    try {
      // Upload file with optional address
      const result = await secureUploadApi.uploadDocument(file, address);

      // Backend returns: { success: true, document: { id, filename, size, type, hash, uploaded_at } }
      if (result.success && result.document?.id) {
        const newDocument: Document = {
          id: result.document.id,
          name: file.name,
          file_path: result.document.filename ?? "",
          file_size: result.document.size ?? file.size,
          file_type: result.document.type ?? file.type,
          category,
          property_id: propertyId,
          offer_id: offerId,
          uploaded_by: "", // Will be set by backend
          uploaded_at: result.document.uploaded_at
            ? new Date(result.document.uploaded_at)
            : new Date(),
          expiry_date: undefined,
          status: "pending",
        };

        return newDocument;
      } else {
        throw new Error(result.error ?? result.message ?? "Upload failed");
      }
    } catch (error: unknown) {
      log.error(LOG_CATEGORIES.ERRORS, "Upload error", error);

      // Improved error message extraction
      let errorMessage = "Upload failed";

      if (error instanceof HttpError) {
        // Try parsedBody first (already parsed JSON)
        if (error.parsedBody && typeof error.parsedBody === "object") {
          const body = error.parsedBody as { message?: string; error?: string };
          errorMessage = body.message || body.error || errorMessage;
        }
        // Fall back to parsing bodyPreview
        else if (error.bodyPreview) {
          try {
            const errorBody = JSON.parse(error.bodyPreview);
            if (errorBody.message) {
              errorMessage = errorBody.message;
            } else if (errorBody.error) {
              errorMessage = errorBody.error;
            }
          } catch {
            // If parsing fails, use generic message
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  async updateDocumentStatus(
    docId: string,
    status: Document["status"],
  ): Promise<Document> {
    try {
      const response = await dashboardApi.updateDocumentStatus(docId, status);
      if (response.success && response.document) {
        const updatedDocument: Document = {
          ...response.document,
          uploaded_at: new Date(response.document.uploaded_at),
          expiry_date: response.document.expiry_date
            ? new Date(response.document.expiry_date)
            : undefined,
        };

        return updatedDocument;
      } else {
        throw new Error(response.error ?? "Failed to update document status");
      }
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        log.error(LOG_CATEGORIES.ERRORS, "Failed to update document status", e);
        throw e;
      }
      throw e;
    }
  }

  async signDocument(docId: string): Promise<Document> {
    try {
      const response = await dashboardApi.signDocument(docId);
      if (response.success && response.document) {
        const signedDocument: Document = {
          ...response.document,
          uploaded_at: new Date(response.document.uploaded_at),
          expiry_date: response.document.expiry_date
            ? new Date(response.document.expiry_date)
            : undefined,
        };

        return signedDocument;
      } else {
        throw new Error(response.error ?? "Failed to sign document");
      }
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        log.error(LOG_CATEGORIES.ERRORS, "Failed to sign document", e);
        throw e;
      }
      throw e;
    }
  }

  async downloadDocument(docId: string): Promise<void> {
    try {
      await secureUploadApi.downloadDocument(docId);
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        log.error(LOG_CATEGORIES.ERRORS, "Failed to download document", e);
        throw e;
      }
      throw e;
    }
  }

  async deleteDocument(docId: string): Promise<void> {
    try {
      const json = await secureUploadApi.deleteDocument(docId);

      if (!json.success) {
        throw new Error(json.error ?? "Failed to delete document");
      }
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        log.error(LOG_CATEGORIES.ERRORS, "Failed to delete document", e);
        throw e;
      }
      throw e;
    }
  }

  /* =========================
     Helper Methods
     ========================= */

  getDocumentsByCategory(documents: Document[], category: string): Document[] {
    return documents.filter((doc) => doc.category === category);
  }

  getDocumentsByProperty(
    documents: Document[],
    propertyId: string,
  ): Document[] {
    return documents.filter((doc) => doc.property_id === propertyId);
  }

  getDocumentsByOffer(documents: Document[], offerId: string): Document[] {
    return documents.filter((doc) => doc.offer_id === offerId);
  }

  /* =========================
     Abort Management
     ========================= */

  withAbort<T>(fn: (signal?: AbortSignal) => Promise<T>): Promise<T> {
    return this.abortManager.withAbort(fn);
  }

  abortAll(): void {
    this.abortManager.abortAll();
  }
}

// Export singleton instance
export const documentService = new DocumentService();
