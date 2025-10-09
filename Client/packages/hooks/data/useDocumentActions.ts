// Generic PDF modal and file download utilities - reusable logic without business nouns
import { useState, useCallback } from "react";

import { reportApi } from "../../config/api";
import { asError } from "../../utils/error";
import { showErrorToast } from "../ui/useToast";

export type PdfModalHooks = {
  currentPdf: string | null;
  currentDocumentId: string | null;
  currentDocumentName: string | null;
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  toggleModal: () => void;
  getFreshViewUrl: (documentId: string) => string | null;
  getFreshDownloadUrl: (documentId: string) => Promise<string | null>;
  downloadDocument: (documentId: string, documentName: string) => Promise<void>;
  shareDocument: (
    documentId: string,
    documentName: string,
  ) => Promise<{ success: boolean; message: string }>;
  downloadFile: (url: string, filename: string) => void;
  openPdfModal: (pdfUrl: string, documentName?: string, documentId?: string) => void;
  closePdfModal: () => void;
  loadingUrls: Set<string>;
  handleViewDocument: (
    documentId: string,
    documentName: string,
  ) => void;
  handleDownloadDocument: (
    documentId: string,
    documentName: string,
  ) => Promise<void>;
  handleShareDocument: (
    documentId: string,
    documentName: string,
  ) => Promise<{ success: boolean; message: string }>;
};

export const usePdfModal = (): PdfModalHooks => {
  const [currentPdf, setCurrentPdf] = useState<string | null>(null);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [currentDocumentName, setCurrentDocumentName] = useState<string | null>(
    null,
  );
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
  
  // Simple modal state management without the extra useModal hook
  const [isOpen, setIsOpen] = useState(false);
  
  const open = useCallback(() => {
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = "auto";
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    document.body.style.overflow = isOpen ? "auto" : "hidden";
  }, [isOpen]);

  // File download functionality - moved from useFileDownload
  const downloadFile = useCallback((url: string, filename: string) => {
    try {
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: unknown) {
      console.error("Download failed:", error);
      try {
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (fallbackError: unknown) {
        const error = asError(fallbackError);
        console.error("Fallback download failed:", error);
      }
    }
  }, []);

  const getFreshViewUrl = useCallback(
    (documentId: string): string | null => {
      try {
        // Instead of calling the old API, return our proxy URL directly
        if (typeof window !== 'undefined') {
          const baseUrl = window.location.origin;
          const viewUrl = `${baseUrl}/api/v1/report/${documentId}/view`;
          console.log("[useDocumentActions] Generated view URL", {
            documentId,
            baseUrl,
            viewUrl,
            timestamp: new Date().toISOString(),
          });
          return viewUrl;
        }
        console.warn("[useDocumentActions] Window is undefined, cannot generate URL");
        return null;
      } catch (err: unknown) {
        const error = asError(err);
        console.error("[useDocumentActions] Failed to get fresh view URL", {
          error,
          documentId,
          timestamp: new Date().toISOString(),
        });
        return null;
      }
    },
    [],
  );

  const getFreshDownloadUrl = useCallback(
    async (documentId: string): Promise<string | null> => {
      try {
        const response = await reportApi.getDownloadUrl(documentId);
        return response.success ? (response.downloadUrl ?? null) : null;
      } catch (err: unknown) {
        const error = asError(err);
        console.error("Failed to get fresh download URL", error);
        return null;
      }
    },
    [],
  );

  const downloadDocument = useCallback(
    async (documentId: string, documentName: string) => {
      setLoadingUrls((prev) => new Set(prev).add(documentId));
      try {
        const downloadUrl = await getFreshDownloadUrl(documentId);
        if (downloadUrl) {
          const filename = `${documentName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
          downloadFile(downloadUrl, filename);
        } else {
          console.error("Failed to get PDF download URL");
        }
      } finally {
        setLoadingUrls((prev) => {
          const newSet = new Set(prev);
          newSet.delete(documentId);
          return newSet;
        });
      }
    },
    [getFreshDownloadUrl, downloadFile],
  );

  const shareDocument = useCallback(
    async (documentId: string, documentName: string) => {
      return await reportApi.shareDocument(documentId, documentName);
    },
    [],
  );

  const openPdfModal = useCallback(
    (pdfUrl: string, documentName?: string, documentId?: string) => {
      console.log("[useDocumentActions] Opening PDF modal - START", {
        pdfUrl,
        documentName,
        documentId,
        urlLength: pdfUrl.length,
        urlStartsWith: pdfUrl.substring(0, 50),
        timestamp: new Date().toISOString(),
      });
      
      // Set all states synchronously - React will batch these updates
      setCurrentPdf(pdfUrl);
      setCurrentDocumentId(documentId ?? null);
      setCurrentDocumentName(documentName ?? null);
      setIsOpen(true);
      document.body.style.overflow = "hidden";
      
      console.log("[useDocumentActions] Opening PDF modal - COMPLETE", {
        documentId,
        timestamp: new Date().toISOString(),
      });
    },
    [],
  );

  const handleViewDocument = useCallback(
    (documentId: string, documentName: string) => {
      console.log("[useDocumentActions] handleViewDocument called", {
        documentId,
        documentName,
        timestamp: new Date().toISOString(),
      });
      
      try {
        // Generate URL synchronously (no await needed)
        const pdfUrl = getFreshViewUrl(documentId);
        console.log("[useDocumentActions] Got PDF URL", {
          documentId,
          pdfUrl,
          success: !!pdfUrl,
          timestamp: new Date().toISOString(),
        });
        
        if (pdfUrl) {
          // Open modal immediately - no async delays
          openPdfModal(pdfUrl, documentName, documentId);
        } else {
          console.error("[useDocumentActions] Failed to get PDF view URL for document:", {
            documentId,
            documentName,
            timestamp: new Date().toISOString(),
          });
          showErrorToast("Unable to view document. Please try again later.");
        }
      } catch (error: unknown) {
        console.error("[useDocumentActions] Error viewing document:", {
          error,
          documentId,
          documentName,
          stack: error instanceof Error ? error.stack : "No stack trace",
          timestamp: new Date().toISOString(),
        });
        showErrorToast("Error viewing document. Please try again later.");
      }
    },
    [getFreshViewUrl, openPdfModal],
  );

  const handleDownloadDocument = useCallback(
    async (documentId: string, documentName: string) => {
      try {
        await downloadDocument(documentId, documentName);
      } catch (error: unknown) {
        console.error("Error downloading document:", error);
        void void showErrorToast(
          "Error downloading document. Please try again later.",
        );
      }
    },
    [downloadDocument],
  );

  const handleShareDocument = useCallback(
    async (documentId: string, documentName: string) => {
      try {
        return await shareDocument(documentId, documentName);
      } catch (error: unknown) {
        console.error("Error sharing document:", error);
        return {
          success: false,
          message: "Error sharing document. Please try again later.",
        };
      }
    },
    [shareDocument],
  );

  const closePdfModal = useCallback(() => {
    setCurrentPdf(null);
    setCurrentDocumentId(null);
    setCurrentDocumentName(null);
    setIsOpen(false);
    document.body.style.overflow = "auto";
  }, []);

  return {
    currentPdf,
    currentDocumentId,
    currentDocumentName,
    isOpen,
    openModal: open,
    closeModal: close,
    toggleModal: toggle,
    getFreshViewUrl,
    getFreshDownloadUrl,
    downloadDocument,
    shareDocument,
    downloadFile,
    openPdfModal,
    closePdfModal,
    loadingUrls,
    handleViewDocument,
    handleDownloadDocument,
    handleShareDocument,
  };
};

// Legacy export for backward compatibility
export const useDocumentActions = usePdfModal;
