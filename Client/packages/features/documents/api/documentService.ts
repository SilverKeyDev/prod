import { dashboardApi, secureUploadApi } from "packages/config/http/api";
import type {
  DocumentCategory,
  WorkflowDocument,
} from "packages/features/documents/types/documents";
import { log } from "packages/logger";
import { createAbortManager, HttpError, isAbortError } from "packages/services/http";
import { dateNow, dateParseISO } from "packages/utils/date";
import { resolveApiResultErrorMessage } from "packages/utils/errorHandling";

/** Client-side category when upload UI does not collect one (not sent on multipart upload). */
export const DEFAULT_UPLOAD_DOCUMENT_CATEGORY = "general";

/* =========================
   Document Service
   ========================= */

export class DocumentService {
  private abortManager = createAbortManager();

  /* =========================
     Fetch Methods
     ========================= */

  async fetchDocuments(): Promise<WorkflowDocument[]> {
    // getDocuments should not be called - return empty array
    log.warn("API", "fetchDocuments called but getDocuments should not be used");
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
        description: "Sales contracts and related documents",
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
    category?: string,
    propertyId?: string,
    offerId?: string,
    address?: string
  ): Promise<WorkflowDocument> {
    const resolvedCategory = category ?? DEFAULT_UPLOAD_DOCUMENT_CATEGORY;
    try {
      const result = await secureUploadApi.uploadDocument(file, address);

      // Backend returns: { success: true, document: { id, filename, size, type, hash, uploaded_at } }
      if (result.success && result.document?.id) {
        const newDocument: WorkflowDocument = {
          document_record_kind: "workflow",
          id: result.document.id,
          name: file.name,
          file_path: result.document.filename ?? "",
          file_size: result.document.size ?? file.size,
          file_type: result.document.type ?? file.type,
          category: resolvedCategory,
          property_id: propertyId,
          offer_id: offerId,
          uploaded_by: "", // Will be set by backend
          uploaded_at: result.document.uploaded_at
            ? dateParseISO(result.document.uploaded_at).toDate()
            : dateNow().toDate(),
          expiry_date: undefined,
          status: "pending",
        };

        return newDocument;
      } else {
        throw new Error(result.error ?? result.message ?? "Upload failed");
      }
    } catch (error: unknown) {
      log.error("ERRORS", "Upload error", error);

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
    status: WorkflowDocument["status"]
  ): Promise<WorkflowDocument> {
    try {
      const response = await dashboardApi.updateDocumentStatus(docId, status);
      if (response.success && response.document) {
        const updatedDocument: WorkflowDocument = {
          ...response.document,
          uploaded_at: dateParseISO(response.document.uploaded_at).toDate(),
          expiry_date: response.document.expiry_date
            ? dateParseISO(response.document.expiry_date).toDate()
            : undefined,
        };

        return updatedDocument;
      } else {
        throw new Error(resolveApiResultErrorMessage(response, "Failed to update document status"));
      }
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        log.error("ERRORS", "Failed to update document status", e);
        throw e;
      }
      throw e;
    }
  }

  async signDocument(docId: string): Promise<WorkflowDocument> {
    try {
      const response = await dashboardApi.signDocument(docId);
      if (response.success && response.document) {
        const signedDocument: WorkflowDocument = {
          ...response.document,
          uploaded_at: dateParseISO(response.document.uploaded_at).toDate(),
          expiry_date: response.document.expiry_date
            ? dateParseISO(response.document.expiry_date).toDate()
            : undefined,
        };

        return signedDocument;
      } else {
        throw new Error(resolveApiResultErrorMessage(response, "Failed to sign document"));
      }
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        log.error("ERRORS", "Failed to sign document", e);
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
        log.error("ERRORS", "Failed to download document", e);
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
        log.error("ERRORS", "Failed to delete document", e);
        throw e;
      }
      throw e;
    }
  }

  /* =========================
     Helper Methods
     ========================= */

  getDocumentsByCategory(documents: WorkflowDocument[], category: string): WorkflowDocument[] {
    return documents.filter((doc) => doc.category === category);
  }

  getDocumentsByProperty(documents: WorkflowDocument[], propertyId: string): WorkflowDocument[] {
    return documents.filter((doc) => doc.property_id === propertyId);
  }

  getDocumentsByOffer(documents: WorkflowDocument[], offerId: string): WorkflowDocument[] {
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
