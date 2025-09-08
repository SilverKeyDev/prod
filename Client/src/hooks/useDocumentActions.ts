// Generic PDF modal and file download utilities - reusable logic without business nouns
import { useState, useCallback } from 'react';
import { reportApi } from '../api';
import { useModal } from './useModal';

export interface PdfModalHooks {
  currentPdf: string | null;
  currentDocumentName: string | null;
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  toggleModal: () => void;
  getFreshViewUrl: (documentId: string) => Promise<string | null>;
  getFreshDownloadUrl: (documentId: string) => Promise<string | null>;
  downloadDocument: (documentId: string, documentName: string) => Promise<void>;
  shareDocument: (documentId: string, documentName: string) => Promise<{ success: boolean; message: string }>;
  downloadFile: (url: string, filename: string) => void;
  openPdfModal: (pdfUrl: string, documentName?: string) => void;
  closePdfModal: () => void;
  loadingUrls: Set<string>;
  handleViewDocument: (documentId: string, documentName: string) => Promise<void>;
  handleDownloadDocument: (documentId: string, documentName: string) => Promise<void>;
  handleShareDocument: (documentId: string, documentName: string) => Promise<{ success: boolean; message: string }>;
}

export const usePdfModal = (): PdfModalHooks => {
  const [currentPdf, setCurrentPdf] = useState<string | null>(null);
  const [currentDocumentName, setCurrentDocumentName] = useState<string | null>(null);
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
  const { isOpen, open, close, toggle } = useModal();

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
    } catch (error) {
      console.error("Download failed:", error);
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (fallbackError) {
        console.error("Fallback download failed:", fallbackError);
      }
    }
  }, []);

  const getFreshViewUrl = useCallback(async (documentId: string): Promise<string | null> => {
    try {
      const response = await reportApi.getViewUrl(documentId);
      return response.success ? response.viewUrl || null : null;
    } catch (err) {
      console.error("Failed to get fresh view URL", err);
      return null;
    }
  }, []);

  const getFreshDownloadUrl = useCallback(async (documentId: string): Promise<string | null> => {
    try {
      const response = await reportApi.getDownloadUrl(documentId);
      return response.success ? response.downloadUrl || null : null;
    } catch (err) {
      console.error("Failed to get fresh download URL", err);
      return null;
    }
  }, []);

  const downloadDocument = useCallback(async (documentId: string, documentName: string) => {
    setLoadingUrls(prev => new Set(prev).add(documentId));
    try {
      const downloadUrl = await getFreshDownloadUrl(documentId);
      if (downloadUrl) {
        const filename = `${documentName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
        downloadFile(downloadUrl, filename);
      } else {
        console.error("Failed to get PDF download URL");
      }
    } finally {
      setLoadingUrls(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  }, [getFreshDownloadUrl, downloadFile]);

  const shareDocument = useCallback(async (documentId: string, documentName: string) => {
    return await reportApi.shareDocument(documentId, documentName);
  }, []);

  const openPdfModal = useCallback((pdfUrl: string, documentName?: string) => {
    setCurrentPdf(pdfUrl);
    setCurrentDocumentName(documentName || null);
    open();
  }, [open]);

  const handleViewDocument = useCallback(async (documentId: string, documentName: string) => {
    setLoadingUrls(prev => new Set(prev).add(documentId));
    try {
      const pdfUrl = await getFreshViewUrl(documentId);
      if (pdfUrl) {
        openPdfModal(pdfUrl, documentName);
      } else {
        console.error("Failed to get PDF view URL for document:", documentId);
        // Show user-friendly error message
        alert("Unable to view document. Please try again later.");
      }
    } catch (error) {
      console.error("Error viewing document:", error);
      alert("Error viewing document. Please try again later.");
    } finally {
      setLoadingUrls(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  }, [getFreshViewUrl, openPdfModal]);

  const handleDownloadDocument = useCallback(async (documentId: string, documentName: string) => {
    try {
      await downloadDocument(documentId, documentName);
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Error downloading document. Please try again later.");
    }
  }, [downloadDocument]);

  const handleShareDocument = useCallback(async (documentId: string, documentName: string) => {
    try {
      return await shareDocument(documentId, documentName);
    } catch (error) {
      console.error("Error sharing document:", error);
      return {
        success: false,
        message: "Error sharing document. Please try again later."
      };
    }
  }, [shareDocument]);

  const closePdfModal = useCallback(() => {
    setCurrentPdf(null);
    setCurrentDocumentName(null);
    close();
  }, [close]);

  return {
    currentPdf,
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
