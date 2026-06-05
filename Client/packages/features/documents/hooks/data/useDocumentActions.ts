// Generic PDF modal and file download utilities - reusable logic without business nouns
import { useCallback, useState } from "react";

import { getBaseUrl } from "packages/config";
import { showErrorToast } from "packages/hooks/ui";
import { log } from "packages/logger";
import { asError } from "packages/utils";
import { getDocument, getWindow } from "packages/utils/core/platform";

import { reportApi } from "@/features/documents/api/report";

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
    documentName: string
  ) => Promise<{ success: boolean; message: string }>;
  downloadFile: (url: string, filename: string) => void;
  openPdfModal: (pdfUrl: string, documentName?: string, documentId?: string) => void;
  closePdfModal: () => void;
  loadingUrls: Set<string>;
  handleViewDocument: (documentId: string, documentName: string) => void;
  handleDownloadDocument: (documentId: string, documentName: string) => Promise<void>;
  handleShareDocument: (
    documentId: string,
    documentName: string
  ) => Promise<{ success: boolean; message: string }>;
};

export const useDocumentActions = (): PdfModalHooks => {
  const [currentPdf, setCurrentPdf] = useState<string | null>(null);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [currentDocumentName, setCurrentDocumentName] = useState<string | null>(null);
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());

  // Simple modal state management without the extra useModal hook
  const [isOpen, setIsOpen] = useState(false);

  const doc = getDocument();
  const open = useCallback(() => {
    setIsOpen(true);
    if (doc) doc.body.style.overflow = "hidden";
  }, [doc]);

  const close = useCallback(() => {
    setIsOpen(false);
    if (doc) doc.body.style.overflow = "auto";
  }, [doc]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (doc) doc.body.style.overflow = isOpen ? "auto" : "hidden";
  }, [doc, isOpen]);

  // File download functionality - moved from useFileDownload
  const downloadFile = useCallback((url: string, filename: string) => {
    const documentRef = getDocument();
    const win = getWindow();
    try {
      if (documentRef) {
        const link = documentRef.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        documentRef.body.appendChild(link);
        link.click();
        documentRef.body.removeChild(link);
        return;
      }
      if (win) win.open(url, "_blank", "noopener,noreferrer");
    } catch (error: unknown) {
      log.error("ERRORS", "Download failed", error);
      try {
        if (win) win.open(url, "_blank", "noopener,noreferrer");
      } catch (fallbackError: unknown) {
        const fallbackErr = asError(fallbackError);
        log.error("ERRORS", "Fallback download failed", fallbackErr);
      }
    }
  }, []);

  const getFreshViewUrl = useCallback((documentId: string): string | null => {
    try {
      const win = getWindow();

      // Web: prefer window.origin so we stay on the same host as the app.
      if (win?.location?.origin) {
        const baseUrl = win.location.origin;
        const viewUrl = `${baseUrl}/api/v1/report/${documentId}/view`;
        return viewUrl;
      }

      // React Native or environments without window: fall back to configured API base URL.
      const apiBaseUrl = getBaseUrl();
      if (apiBaseUrl) {
        const viewUrl = `${apiBaseUrl.replace(/\/+$/, "")}/api/v1/report/${documentId}/view`;
        return viewUrl;
      }

      log.warn("API", "Unable to determine base URL for report view", {
        documentId,
      });
      return null;
    } catch (err: unknown) {
      const error = asError(err);
      log.error("ERRORS", "Failed to get fresh view URL", {
        error,
        documentId,
      });
      return null;
    }
  }, []);

  const getFreshDownloadUrl = useCallback(async (documentId: string): Promise<string | null> => {
    try {
      const response = await reportApi.getDownloadUrl(documentId);
      return response.success ? (response.downloadUrl ?? null) : null;
    } catch (err: unknown) {
      const error = asError(err);
      log.error("ERRORS", "Failed to get fresh download URL", {
        error,
        documentId,
      });
      return null;
    }
  }, []);

  const downloadDocument = useCallback(
    async (documentId: string, documentName: string) => {
      setLoadingUrls((prev) => new Set(prev).add(documentId));
      try {
        const downloadUrl = await getFreshDownloadUrl(documentId);
        if (downloadUrl) {
          const filename = `${documentName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
          downloadFile(downloadUrl, filename);
        } else {
          log.error("ERRORS", "Failed to get PDF download URL", {
            documentId,
            documentName,
          });
          showErrorToast("Unable to download document. Please try again later.");
        }
      } finally {
        setLoadingUrls((prev) => {
          const newSet = new Set(prev);
          newSet.delete(documentId);
          return newSet;
        });
      }
    },
    [getFreshDownloadUrl, downloadFile]
  );

  const shareDocument = useCallback(async (documentId: string, documentName: string) => {
    return await reportApi.shareDocument(documentId, documentName);
  }, []);

  const openPdfModal = useCallback((pdfUrl: string, documentName?: string, documentId?: string) => {
    const documentRef = getDocument();
    setCurrentPdf(pdfUrl);
    setCurrentDocumentId(documentId ?? null);
    setCurrentDocumentName(documentName ?? null);
    setIsOpen(true);
    if (documentRef) documentRef.body.style.overflow = "hidden";
  }, []);

  const handleViewDocument = useCallback(
    (documentId: string, documentName: string) => {
      try {
        const pdfUrl = getFreshViewUrl(documentId);
        if (pdfUrl) {
          openPdfModal(pdfUrl, documentName, documentId);
        } else {
          log.error("ERRORS", "Failed to get PDF view URL", {
            documentId,
            documentName,
          });
          showErrorToast("Unable to view document. Please try again later.");
        }
      } catch (error: unknown) {
        log.error("ERRORS", "Error viewing document", {
          error,
          documentId,
          documentName,
        });
        showErrorToast("Error viewing document. Please try again later.");
      }
    },
    [getFreshViewUrl, openPdfModal]
  );

  const handleDownloadDocument = useCallback(
    async (documentId: string, documentName: string) => {
      try {
        await downloadDocument(documentId, documentName);
      } catch (error: unknown) {
        log.error("ERRORS", "Error downloading document", {
          error,
          documentId,
          documentName,
        });
        showErrorToast("Error downloading document. Please try again later.");
      }
    },
    [downloadDocument]
  );

  const handleShareDocument = useCallback(
    async (documentId: string, documentName: string) => {
      log.info("DOCUMENTS", "handleShareDocument invoked", {
        documentId,
        documentName,
      });
      try {
        const result = await shareDocument(documentId, documentName);
        log.info("DOCUMENTS", "handleShareDocument finished", {
          documentId,
          documentName,
          success: result.success,
          message: result.message,
        });
        return result;
      } catch (error: unknown) {
        log.error("ERRORS", "Error sharing document", {
          error,
          documentId,
          documentName,
        });
        return {
          success: false,
          message: "Error sharing document. Please try again later.",
        };
      }
    },
    [shareDocument]
  );

  const closePdfModal = useCallback(() => {
    const documentRef = getDocument();
    setCurrentPdf(null);
    setCurrentDocumentId(null);
    setCurrentDocumentName(null);
    setIsOpen(false);
    if (documentRef) documentRef.body.style.overflow = "auto";
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
