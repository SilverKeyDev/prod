import { dashboardApi, secureUploadApi } from "../config/api";
import type { Document, DocumentCategory } from "../schemas";
import { isDocumentData } from "../utils/typeGuards";

import { createAbortManager, isAbortError } from "./http";

/* =========================
   Document Service
   ========================= */

export class DocumentService {
  private abortManager = createAbortManager();

  /* =========================
     Fetch Methods
     ========================= */

  async fetchDocuments(): Promise<Document[]> {
    try {
      const response = await dashboardApi.getDocuments();
      if (response.success && response.documents) {
        // Transform server response to client Document format
        const documents = response.documents as unknown[];
        return documents.filter(isDocumentData).map((doc: unknown) => {
          const docData = doc as Record<string, unknown>;
          return {
            id:
              typeof docData.id === "string" || typeof docData.id === "number"
                ? String(docData.id)
                : "",
            name:
              typeof docData.filename === "string" ||
              typeof docData.filename === "number"
                ? String(docData.filename)
                : "",
            file_path:
              typeof docData.file_path === "string" ||
              typeof docData.file_path === "number"
                ? String(docData.file_path)
                : "",
            file_size: 0, // Not provided by server
            file_type: "application/pdf", // Server only handles PDFs
            category: "report", // Default category for server documents
            property_id: undefined,
            offer_id: undefined,
            uploaded_by:
              typeof docData.user_id === "string" ||
              typeof docData.user_id === "number"
                ? String(docData.user_id)
                : "",
            uploaded_at: new Date(
              typeof docData.created_at === "string" ||
              typeof docData.created_at === "number"
                ? String(docData.created_at)
                : "",
            ),
            is_signed: false,
            expiry_date: undefined,
            status:
              String(docData.status) === "completed" ? "approved" : "pending",
          };
        });
      } else {
        return [];
      }
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        console.error("Failed to fetch documents", e);
        throw e;
      }
      throw e;
    }
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
  ): Promise<Document> {
    try {
      const metadata = {
        category,
        ...(propertyId && { property_id: propertyId }),
        ...(offerId && { offer_id: offerId }),
      };

      const result = await secureUploadApi.uploadDocument(file, metadata);

      if (result.success && result.file_id) {
        const newDocument: Document = {
          id: result.file_id ?? `doc-${Date.now()}`,
          name: file.name,
          file_path: result.file_url ?? "",
          file_size: result.file_size ?? file.size,
          file_type: result.content_type ?? file.type,
          category,
          property_id: propertyId,
          offer_id: offerId,
          uploaded_by: "", // Will be set by backend
          uploaded_at: new Date(),
          expiry_date: undefined,
          status: "pending",
        };

        return newDocument;
      } else {
        throw new Error(result.error ?? "Upload failed");
      }
    } catch (error: unknown) {
      console.error("Upload error:", error);
      throw error;
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
        console.error("Failed to update document status", e);
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
        console.error("Failed to sign document", e);
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
        console.error("Failed to download document", e);
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
        console.error("Failed to delete document", e);
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
