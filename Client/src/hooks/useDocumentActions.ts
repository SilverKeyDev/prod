import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface DocumentActionHooks {
  loadingUrls: Set<string>;
  handleViewDocument: (documentId: string, documentName?: string) => Promise<void>;
  handleDownloadDocument: (documentId: string, documentName: string) => Promise<void>;
  handleShareDocument: (documentName: string) => Promise<{ success: boolean; message: string }>;
  openPdfModal: (pdfUrl: string, documentName?: string) => void;
  closePdfModal: () => void;
  currentPdf: string | null;
  currentDocumentName: string | null;
}

export const useDocumentActions = (): DocumentActionHooks => {
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
  const [currentPdf, setCurrentPdf] = useState<string | null>(null);
  const [currentDocumentName, setCurrentDocumentName] = useState<string | null>(null);

  const getFreshViewUrl = async (documentId: string): Promise<string | null> => {
    try {
      setLoadingUrls((prev) => new Set(prev).add(documentId));

      const baseUrl = API_BASE_URL || "";
      const url = `${baseUrl}/api/v1/report/${documentId}/view-url`;
      
      const res = await fetch(url, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to get view URL");
      }

      const data = await res.json();
      if (data.success && data.viewUrl) {
        return data.viewUrl;
      }

      return null;
    } catch (err) {
      console.error("Failed to get fresh view URL", err);
      return null;
    } finally {
      setLoadingUrls((prev) => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const getFreshDownloadUrl = async (documentId: string): Promise<string | null> => {
    try {
      setLoadingUrls((prev) => new Set(prev).add(documentId));

      const baseUrl = API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/api/v1/report/${documentId}/download-url`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to get download URL");
      }

      const data = await res.json();
      if (data.success && data.downloadUrl) {
        return data.downloadUrl;
      }

      return null;
    } catch (err) {
      console.error("Failed to get fresh download URL", err);
      return null;
    } finally {
      setLoadingUrls((prev) => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const handleViewDocument = useCallback(async (documentId: string, documentName?: string) => {
    const pdfUrl = await getFreshViewUrl(documentId);

    if (pdfUrl) {
      openPdfModal(pdfUrl, documentName);
    } else {
      console.error("Failed to get PDF view URL");
    }
  }, []);

  const handleDownloadDocument = useCallback(async (documentId: string, documentName: string) => {
    const pdfUrl = await getFreshDownloadUrl(documentId);

    if (pdfUrl) {
      try {
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.setAttribute(
          "download",
          `${documentName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`
        );
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        // Append to DOM to ensure download triggers
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Download failed:", error);
        // If programmatic download fails, open in new tab as fallback
        try {
          window.open(pdfUrl, '_blank', 'noopener,noreferrer');
        } catch (fallbackError) {
          console.error("Fallback download failed:", fallbackError);
        }
      }
    } else {
      console.error("Failed to get PDF download URL");
    }
  }, []);

  const handleShareDocument = useCallback(async (documentName: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Format the document name for sharing
      const shareText = `Property Report - ${documentName
        .replace(/_/g, " ")
        .slice(0, -18)
        .trim()}`;

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        return { success: true, message: "Report info copied to clipboard" };
      } else {
        return { success: false, message: "Sharing not supported on this device" };
      }
    } catch (error) {
      console.error("Share failed:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to share report"
      };
    }
  }, []);

  const openPdfModal = useCallback((pdfUrl: string, documentName?: string) => {
    setCurrentPdf(pdfUrl);
    setCurrentDocumentName(documentName || null);
    document.body.style.overflow = "hidden";
  }, []);

  const closePdfModal = useCallback(() => {
    setCurrentPdf(null);
    setCurrentDocumentName(null);
    document.body.style.overflow = "auto";
  }, []);

  return {
    loadingUrls,
    handleViewDocument,
    handleDownloadDocument,
    handleShareDocument,
    openPdfModal,
    closePdfModal,
    currentPdf,
    currentDocumentName,
  };
};
