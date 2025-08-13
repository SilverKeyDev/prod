// Utility functions for PDF interactions (open, download, share, etc.)
// Add implementations as needed for PastReports, PdfModal, etc.

// PDF Interactions Utility
// All PDF Delete, Share, Download, and View logic extracted from PastReports.tsx

export interface PdfReport {
  id: string;
  address: string;
  pdfUrl?: string | null;
  s3Key?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function getFreshViewUrl(reportId: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/report/${reportId}/view-url`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to get view URL");
    const data = await res.json();
    if (data.success && data.viewUrl) return data.viewUrl;
    return null;
  } catch (err) {
    console.error("Failed to get fresh view URL", err);
    return null;
  }
}

export async function getFreshDownloadUrl(reportId: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/report/${reportId}/download-url`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to get download URL");
    const data = await res.json();
    if (data.success && data.downloadUrl) return data.downloadUrl;
    return null;
  } catch (err) {
    console.error("Failed to get fresh download URL", err);
    return null;
  }
}

export async function handleViewPdf(report: PdfReport, openModal: (pdfUrl: string, reportAddress?: string) => void): Promise<void> {
  const pdfUrl = await getFreshViewUrl(report.id);
  if (pdfUrl) {
    openModal(pdfUrl, report.address);
  } else {
    console.error("Failed to get PDF view URL");
  }
}

export async function handleDownloadPdf(report: PdfReport, pdfUrlCache: Record<string, string>, setPdfUrlCache: (cache: Record<string, string>) => void, onError?: (msg: string) => void): Promise<void> {
  let pdfUrl = report.pdfUrl;
  if (!pdfUrl && report.s3Key) {
    pdfUrl = await getFreshDownloadUrl(report.id);
    if (pdfUrl) {
      setPdfUrlCache({ ...pdfUrlCache, [report.id]: pdfUrl });
    }
  } else if (pdfUrlCache[report.id]) {
    pdfUrl = pdfUrlCache[report.id];
  }
  if (pdfUrl) {
    try {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.setAttribute("download", `${report.address.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      onError && onError("Failed to download PDF. Please try again.");
    }
  } else {
    console.error("Failed to get PDF URL for download");
    onError && onError("Failed to download PDF. Please try again.");
  }
}

export async function handleShareReport(report: PdfReport, pdfUrlCache: Record<string, string>, setPdfUrlCache: (cache: Record<string, string>) => void, onSuccess?: (msg: string) => void, onError?: (msg: string) => void): Promise<void> {
  try {
    let pdfUrl = report.pdfUrl;
    if (!pdfUrl) {
      pdfUrl = await getFreshDownloadUrl(report.id);
      if (pdfUrl) {
        setPdfUrlCache({ ...pdfUrlCache, [report.id]: pdfUrl });
      }
    }
    if (!pdfUrl) throw new Error("Unable to get report URL");
    const shareData = {
      title: `Property Report - ${report.address.replace(/_/g, " ").slice(0, -18).trim()}`,
      text: `Check out this property report for ${report.address.replace(/_/g, " ").slice(0, -18).trim()}`,
      url: pdfUrl,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      onSuccess && onSuccess("Report shared successfully");
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(`Property Report: ${shareData.title} - ${pdfUrl}`);
      onSuccess && onSuccess("Report link copied to clipboard");
    } else {
      onError && onError("Sharing not supported on this device");
    }
  } catch (error) {
    console.error("Share failed:", error);
    onError && onError(error instanceof Error ? error.message : "Failed to share report");
  }
}

export async function handleDeleteReport(reportId: string, s3Key: string | null | undefined, onSuccess?: (msg: string) => void, onError?: (msg: string) => void): Promise<void> {
  try {
    let processedS3Key = s3Key;
    if (s3Key) {
      if (s3Key.startsWith("http")) {
        try {
          const url = new URL(s3Key);
          processedS3Key = url.pathname.substring(1);
        } catch (e) {
          console.warn(`[DELETE] Failed to parse URL ${s3Key}:`, e);
        }
      }
    }
    const endpoint = `${API_BASE_URL}/api/v1/report/${reportId}`;
    const res = await fetch(endpoint, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ s3Key: processedS3Key }),
    });
    const responseData = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(responseData.error || `HTTP error! status: ${res.status}`);
    }
    onSuccess && onSuccess("Report deleted successfully");
  } catch (error) {
    console.error("[DELETE] Error deleting report:", error);
    onError && onError(error instanceof Error ? error.message : "Failed to delete report");
  }
}

