import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Download,
  Eye,
  Calendar,
  MapPin,
  Trash2,
  ChevronDown,
  Share,
  RefreshCw,
  X,
} from "lucide-react";
import ErrorToast from "../../components/ErrorToast";
import SuccessToast from "../../components/SuccessToast";
import { useData } from "../../contexts/DataContext";
import { formatFilenameToAddress } from "../../lib/addressFormat";
import MiniLogo from "../../components/MiniLogo";
import PageHeader from "../../components/PageHeader";

interface Report {
  id: string;
  address: string;
  generatedAt: Date;
  status: "completed" | "generating" | "error";
  pdfUrl?: string | null;
  s3Key?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error(
    "VITE_API_BASE_URL is not defined. Please check your environment variables."
  );
}

// Progress bar component for generating reports
interface ProgressBarProps {
  startTime: Date;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ startTime }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const now = new Date();
      const elapsed = (now.getTime() - startTime.getTime()) / 1000; // seconds
      const maxTime = 290; // 240 seconds to reach 95%
      const maxProgress = 95; // 95% completion

      let currentProgress = (elapsed / maxTime) * maxProgress;
      currentProgress = Math.min(currentProgress, maxProgress); // Cap at 95%

      setProgress(currentProgress);
    };

    // Update immediately
    updateProgress();

    // Update every second
    const interval = setInterval(updateProgress, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gold font-medium">Generating...</span>
        <span className="text-xs text-gold font-medium">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full bg-gray-300 rounded-full h-2.5 shadow-inner">
        <div
          className="bg-gold h-2.5 rounded-full transition-all duration-1000 ease-out shadow-sm"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

// PdfModal component moved outside to prevent remounting on every render
interface PdfModalProps {
  currentPdf: string | null;
  currentReportAddress: string | null;
  onClose: () => void;
  onShare?: () => void;
  reports: Report[];
}

const PdfModal: React.FC<PdfModalProps> = ({
  currentPdf,
  currentReportAddress,
  onClose,
  onShare,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Log mount/unmount of the component
  useEffect(() => {
    console.log("[PdfModal] Component mounted");
    return () => {
      console.log("[PdfModal] Component unmounted");
    };
  }, []);

  // Log whenever currentPdf changes while modal is open
  useEffect(() => {
    console.log("[PdfModal] currentPdf updated:", currentPdf);
  }, [currentPdf]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Get report title from the current report address or PDF URL
  const getReportTitle = () => {
    // Use the report address if available (preferred)
    if (currentReportAddress) {
      console.log(
        `[getReportTitle] Using report address:`,
        currentReportAddress
      );
      const result = formatFilenameToAddress(currentReportAddress);
      console.log(`[getReportTitle] Formatted result:`, result);
      return result;
    }

    // Fallback to parsing PDF URL
    if (!currentPdf) return "Property Report";

    console.log(`[getReportTitle] Fallback to PDF URL:`, currentPdf);
    const result = formatFilenameToAddress(currentPdf);
    console.log(`[getReportTitle] Output result:`, result);
    return result;
  };

  const handleDownload = () => {
    if (currentPdf) {
      const link = document.createElement("a");
      link.href = currentPdf;
      link.download = `${getReportTitle()}.pdf`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!currentPdf) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        ref={modalRef}
        className="viewer-container w-full max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        style={{
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
          backdropFilter: "blur(12px)",
          background: "rgba(255, 255, 255, 0.1)",
          overflow: "hidden",
        }}
      >
        {/* Gold Header with Address and Actions */}
        <div
          className="bg-gradient-to-r from-brown to-brown/90 px-4 py-3 flex items-center justify-between"
          style={{ borderRadius: "24px 24px 0 0" }}
        >
          {/* Logo and Address Title */}
          <div className="flex items-center space-x-3">
            <div
              className="text-white"
              style={{ filter: "brightness(0) invert(1)" }}
            >
              <MiniLogo className="w-6 h-6" />
            </div>
            <h2 className="text-white font-semibold text-lg truncate">
              {getReportTitle()}
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 group"
              title="Download PDF"
            >
              <Download className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-200" />
            </button>

            {/* Share Button */}
            {onShare && (
              <button
                onClick={onShare}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 group"
                title="Share Report"
              >
                <Share className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-200" />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 group"
              title="Close"
            >
              <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div
          className="flex-1 overflow-hidden"
          style={{ background: "rgba(250, 249, 247, 0.3)" }}
        >
          <iframe
            src={`${currentPdf}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            className="w-full h-full border-0"
            title="PDF Viewer"
            onLoad={() => {
              console.log(
                "[PdfModal] iframe onLoad event fired for:",
                currentPdf
              );
            }}
            onError={(e) => {
              console.error("[PdfModal] Error loading PDF:", e);
              const iframe = e.target as HTMLIFrameElement;
              if (iframe?.contentDocument?.body) {
                iframe.contentDocument.body.innerHTML = `
                <div style="padding: 40px; text-align: center; font-family: system-ui, -apple-system, sans-serif; background: #faf9f7;">
                  <div style="max-width: 400px; margin: 0 auto; padding: 30px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(164, 117, 81, 0.1); border: 1px solid #D4AF7F;">
                    <div style="width: 60px; height: 60px; background: #A47551; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                      <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                    <h3 style="color: #A47551; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">Unable to load PDF preview</h3>
                    <p style="color: #666; margin: 0 0 20px 0; line-height: 1.5;">The PDF couldn't be displayed in the browser. You can download it directly instead.</p>
                    <a href="${currentPdf}" download style="display: inline-block; background: #A47551; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background='#8B5A3C'" onmouseout="this.style.background='#A47551'">
                      Download PDF
                    </a>
                  </div>
                </div>
              `;
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default function PastReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"date" | "address">("date");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use preloaded data from context
  const { reports, reportsLoading, refreshReports } = useData();

  // Refresh data when page loads to ensure latest updates
  useEffect(() => {
    refreshReports();
  }, [refreshReports]);

  // Handle refresh button click with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshReports();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Local cache for PDF URLs to avoid modifying context state
  const [pdfUrlCache, setPdfUrlCache] = useState<Record<string, string>>({});
  const [currentPdf, setCurrentPdf] = useState<string | null>(null);
  const [currentReportAddress, setCurrentReportAddress] = useState<
    string | null
  >(null);
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<{
    id: string;
    s3Key: string | null | undefined;
  } | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const getFreshViewUrl = async (reportId: string): Promise<string | null> => {
    try {
      setLoadingUrls((prev) => new Set(prev).add(reportId));

      const baseUrl = API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/api/v1/report/${reportId}/view-url`, {
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
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const getFreshDownloadUrl = async (
    reportId: string
  ): Promise<string | null> => {
    try {
      setLoadingUrls((prev) => new Set(prev).add(reportId));

      const baseUrl = API_BASE_URL || "";
      const res = await fetch(
        `${baseUrl}/api/v1/report/${reportId}/download-url`,
        {
          credentials: "include",
        }
      );

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
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const handleViewPdf = async (report: Report) => {
    const pdfUrl = await getFreshViewUrl(report.id);

    if (pdfUrl) {
      openPdfModal(pdfUrl, report.address);
    } else {
      console.error("Failed to get PDF view URL");
    }
  };

  const handleDownloadPdf = async (report: Report) => {
    let pdfUrl = report.pdfUrl;

    if (!pdfUrl && report.s3Key) {
      pdfUrl = await getFreshDownloadUrl(report.id);
      if (pdfUrl) {
        // Cache the fresh URL locally
        setPdfUrlCache((prev) => ({ ...prev, [report.id]: pdfUrl! }));
      }
    } else if (pdfUrlCache[report.id]) {
      // Use cached URL if available
      pdfUrl = pdfUrlCache[report.id];
    }

    if (pdfUrl) {
      try {
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.setAttribute(
          "download",
          `${report.address.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`
        );

        // Append to DOM to ensure download triggers
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Download failed:", error);
        setErrorMessage("Failed to download PDF. Please try again.");
        setShowError(true);
      }
    } else {
      console.error("Failed to get PDF URL for download");
      setErrorMessage("Failed to download PDF. Please try again.");
      setShowError(true);
    }
  };

  // Share individual report
  const handleShareReport = useCallback(async (report: Report) => {
    try {
      setLoadingUrls((prev) => new Set(prev).add(report.id));

      let pdfUrl = report.pdfUrl;
      if (!pdfUrl) {
        pdfUrl = await getFreshDownloadUrl(report.id);
      }

      if (!pdfUrl) {
        throw new Error("Unable to get report URL");
      }

      const shareData = {
        title: `Property Report - ${report.address
          .replace(/_/g, " ")
          .slice(0, -18)
          .trim()}`,
        text: `Check out this property report for ${report.address
          .replace(/_/g, " ")
          .slice(0, -18)
          .trim()}`,
        url: pdfUrl,
      };

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
        setSuccessMessage("Report shared successfully");
        setShowSuccess(true);
      } else {
        // Fallback to clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(
            `Property Report: ${shareData.title} - ${pdfUrl}`
          );
          setSuccessMessage("Report link copied to clipboard");
          setShowSuccess(true);
        } else {
          setErrorMessage("Sharing not supported on this device");
          setShowError(true);
        }
      }
    } catch (error) {
      console.error("Share failed:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to share report"
      );
      setShowError(true);
    } finally {
      setLoadingUrls((prev) => {
        const newSet = new Set(prev);
        newSet.delete(report.id);
        return newSet;
      });
    }
  }, []);

  const openDeleteModal = (
    reportId: string,
    s3Key: string | null | undefined
  ) => {
    console.log("[DELETE] Open delete modal:", { reportId, s3Key });
    setReportToDelete({ id: reportId, s3Key });
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    console.log("[DELETE] Close delete modal");
    setDeleteModalOpen(false);
    setReportToDelete(null);
  };

  const handleDeleteReport = async (
    reportId: string,
    s3Key: string | null | undefined
  ) => {
    console.log(`[DELETE] Starting delete for report ${reportId}`, { s3Key });

    if (!reportId) {
      console.error("[DELETE] Error: No report ID provided");
      return;
    }

    try {
      setLoadingUrls((prev) => new Set(prev).add(reportId));
      console.log(`[DELETE] Added report ${reportId} to loading set`);

      // Prepare the S3 key
      let processedS3Key = s3Key;
      if (s3Key) {
        if (s3Key.startsWith("http")) {
          try {
            const url = new URL(s3Key);
            processedS3Key = url.pathname.substring(1); // Remove leading slash
            console.log(
              `[DELETE] Extracted S3 key from URL: ${s3Key} -> ${processedS3Key}`
            );
          } catch (e) {
            console.warn(`[DELETE] Failed to parse URL ${s3Key}:`, e);
          }
        } else {
          processedS3Key = s3Key;
          console.log(`[DELETE] Using provided S3 key: ${s3Key}`);
        }
      } else {
        console.warn(
          "[DELETE] No S3 key provided, will only delete from in-memory storage"
        );
      }

      const baseUrl = API_BASE_URL || "";
      const endpoint = `${baseUrl}/api/v1/report/${reportId}`;
      console.log(`[DELETE] Sending request to: ${endpoint}`, {
        method: "DELETE",
        s3Key: processedS3Key,
      });

      const startTime = Date.now();
      const res = await fetch(endpoint, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ s3Key: processedS3Key }),
      });

      const responseTime = Date.now() - startTime;
      console.log(`[DELETE] Received response in ${responseTime}ms`, {
        status: res.status,
        statusText: res.statusText,
      });

      const responseData = await res.json().catch(() => ({}));
      console.log("[DELETE] Response data:", responseData);

      if (!res.ok) {
        throw new Error(
          responseData.error || `HTTP error! status: ${res.status}`
        );
      }

      console.log(`[DELETE] Successfully deleted report ${reportId}`);
      closeDeleteModal();
      setSuccessMessage("Report deleted successfully");
      setShowSuccess(true);

      // Refresh the reports list
      console.log("[DELETE] Refreshing reports list...");
      await refreshReports();
    } catch (error) {
      console.error("[DELETE] Error deleting report:", {
        error,
        reportId,
        s3Key,
        stack: error instanceof Error ? error.stack : "No stack trace",
      });

      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete report"
      );
      setShowError(true);
    } finally {
      console.log(`[DELETE] Removing report ${reportId} from loading set`);
      setLoadingUrls((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const filteredReports = reports.filter((report) =>
    report.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === "date") {
      return b.generatedAt.getTime() - a.generatedAt.getTime();
    }
    return a.address.localeCompare(b.address, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "generating":
        return "text-gold bg-gold/10";
      case "error":
        return "text-red-600 bg-red-50";
      default:
        return "text-black/60 bg-beige/20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "generating":
        return "Generating...";
      case "error":
        return "Error";
      default:
        return status;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const openPdfModal = (pdfUrl: string, reportAddress?: string) => {
    console.log("[PdfModal] Opening PDF modal for:", pdfUrl);
    setCurrentPdf(pdfUrl);
    setCurrentReportAddress(reportAddress || null);
    document.body.style.overflow = "hidden";
  };

  const closePdfModal = useCallback(() => {
    console.log("[PdfModal] Closing PDF modal");
    setCurrentPdf(null);
    setCurrentReportAddress(null);
    document.body.style.overflow = "auto";
  }, []);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        closePdfModal();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const pollForReportCompletion = useCallback(
    async (documentId: string) => {
      const pollInterval = 5000; // 5 seconds
      const maxAttempts = 120; // 10 minutes
      let attempts = 0;
      const startTime = Date.now();
      let consecutiveErrors = 0;
      const maxConsecutiveErrors = 5;

      console.log(`\n==============================`);

      const idToken = localStorage.getItem("id_token");
      if (!idToken) {
        console.error(`[PastReports] ❌ No auth token found`);
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      let lastReportSnapshot: string | null = null;

      // Step 1: Initial check
      try {
        const initialResponse = await fetch(
          `${apiBaseUrl}/api/v1/report/poll/${documentId}`,
          {
            method: "GET",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            credentials: "include",
          }
        );

        if (!initialResponse.ok) {
          console.error(
            `[PastReports] ❌ Initial poll failed with status: ${initialResponse.status}`
          );
          return;
        }

        const initialData = await initialResponse.json();

        // LOG EVERY DETAIL OF INITIAL POLL RESPONSE

        if (initialData.success && initialData.report) {
          lastReportSnapshot = JSON.stringify(initialData.report);

          // Check if already completed
          if (
            initialData.report.status === "completed" ||
            initialData.report.status === "error"
          ) {
            await handleRefresh();
            window.dispatchEvent(new CustomEvent("reportGenerated"));
            return;
          }
        } else if (initialData.success && !initialData.report) {
          lastReportSnapshot = null;
          lastReportSnapshot = null;
        } else {
          console.error(
            `[PastReports] ❌ Initial poll failed:`,
            initialData.error
          );
          return;
        }
      } catch (err) {
        console.error(`[PastReports] ❌ Error during initial poll:`, err);
        return;
      }

      // Step 2: Polling loop
      const pollForCompletion = async (): Promise<void> => {
        attempts++;
        const elapsedTime = Math.round((Date.now() - startTime) / 1000);

        console.log(
          `[PastReports] 🔍 Poll attempt ${attempts}/${maxAttempts} (${elapsedTime}s elapsed) for documentId: ${documentId}`
        );

        try {
          const response = await fetch(
            `${apiBaseUrl}/api/v1/report/poll/${documentId}`,
            {
              method: "GET",
              mode: "cors",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${idToken}`,
              },
              credentials: "include",
            }
          );

          if (!response.ok) {
            consecutiveErrors++;
            console.error(
              `[PastReports] ❌ Poll error: ${response.status} ${response.statusText} (${consecutiveErrors}/${maxConsecutiveErrors})`
            );

            if (consecutiveErrors >= maxConsecutiveErrors) {
              console.error(
                `[PastReports] 🚫 Too many consecutive errors (${consecutiveErrors}), aborting poll`
              );
              return;
            }

            if (attempts < maxAttempts) {
              setTimeout(pollForCompletion, pollInterval);
            }
            return;
          }

          const data = await response.json();
          consecutiveErrors = 0; // Reset error counter on success

          if (!data.success) {
            console.error(`[PastReports] ❌ Poll API error:`, data.error);
            if (attempts < maxAttempts) {
              setTimeout(pollForCompletion, pollInterval);
            }
            return;
          }

          // Handle case where report is not found (null)
          if (!data.report) {
            if (lastReportSnapshot !== null) {
              await handleRefresh();
              window.dispatchEvent(new CustomEvent("reportGenerated"));
              return;
            }

            if (attempts < maxAttempts) {
              console.log(
                `[PastReports] ⏳ Report still not found. Polling again in ${pollInterval}ms`
              );
              setTimeout(pollForCompletion, pollInterval);
            } else {
              console.warn(
                `[PastReports] ⚠️ TIMEOUT - Report never appeared after ${
                  elapsedTime / 60
                } mins`
              );
              console.log(`==============================\n`);
            }
            return;
          }

          // Compare report snapshots for changes
          const currentReportSnapshot = JSON.stringify(data.report);
          const hasChanged = currentReportSnapshot !== lastReportSnapshot;

          // Check for completion or significant changes
          if (
            data.report.status === "completed" ||
            data.report.status === "error" ||
            hasChanged
          ) {
            await handleRefresh();
            window.dispatchEvent(new CustomEvent("reportGenerated"));
            return;
          }

          // Update snapshot for next comparison
          lastReportSnapshot = currentReportSnapshot;

          if (attempts < maxAttempts) {
            setTimeout(pollForCompletion, pollInterval);
          } else {
            console.warn(
              `[PastReports] ⚠️ TIMEOUT after ${
                elapsedTime / 60
              } mins — Report still ${data.report.status}`
            );
          }
        } catch (error) {
          consecutiveErrors++;
          console.error(
            `[PastReports] ❌ Polling exception (${consecutiveErrors}/${maxConsecutiveErrors}):`,
            error
          );

          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.error(
              `[PastReports] 🚫 Too many consecutive errors, aborting poll`
            );
            return;
          }

          if (attempts < maxAttempts) {
            setTimeout(pollForCompletion, pollInterval);
          }
        }
      };
      setTimeout(pollForCompletion, pollInterval);
    },
    [refreshReports]
  );

  useEffect(() => {
    // Event listener setup - data is already preloaded by context
    const handleReportGenerated = () => {
      console.log("reportGenerated event received, refreshing reports.");
      refreshReports();
    };

    window.addEventListener("reportGenerated", handleReportGenerated);

    // Expose refresh function globally for GenerateReportPage to call
    (window as any).refreshPastReports = handleRefresh;

    // Expose polling function globally for GenerateReportPage to call
    (window as any).pollForReportCompletion = pollForReportCompletion;

    // Cleanup on unmount
    return () => {
      window.removeEventListener("reportGenerated", handleReportGenerated);
      // Clean up global function references
      delete (window as any).refreshPastReports;
      delete (window as any).pollForReportCompletion;
    };
  }, [handleRefresh, pollForReportCompletion]);

  // Handle clicks outside the sort dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setSortDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Force grid mode on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        // sm breakpoint
        setViewMode("grid");
      }
    };

    // Set initial state
    handleResize();

    // Listen for window resize
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Handler for sharing the current PDF from modal - must be before early return
  const handleShareCurrentPdf = useCallback(() => {
    if (!currentPdf) return;

    // Find the report that matches the current PDF URL
    const matchingReport = reports.find(
      (report) =>
        report.pdfUrl === currentPdf ||
        (report.s3Key && currentPdf.includes(report.s3Key))
    );

    if (matchingReport) {
      handleShareReport(matchingReport);
    }
  }, [currentPdf, reports, handleShareReport]);

  return (
    <div className="max-w-7xl mx-auto mobile-padding">
      {currentPdf && (
        <PdfModal
          currentPdf={currentPdf}
          currentReportAddress={currentReportAddress}
          onClose={closePdfModal}
          onShare={handleShareCurrentPdf}
          reports={reports}
        />
      )}
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete Report
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this report? This action cannot
                be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-black bg-white hover:bg-gray-50 hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brown-500 touch-friendly"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    reportToDelete &&
                    handleDeleteReport(reportToDelete.id, reportToDelete.s3Key)
                  }
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 touch-friendly"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showError && (
        <ErrorToast
          message={errorMessage}
          onClose={() => setShowError(false)}
          duration={5000}
        />
      )}
      {showSuccess && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccess(false)}
          duration={3000}
        />
      )}
      <PageHeader
        title="Past Reports"
        subtitle="Manage and download your generated property reports"
      />
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm text-black/60">
            {filteredReports.length} report
            {filteredReports.length !== 1 ? "s" : ""}
          </span>
        </div>
      <div className="mobile-card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-black/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mobile-input pl-9 sm:pl-10 pr-4"
              placeholder="Filter by address"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 flex-1 sm:max-w-md sm:flex-none">
            <div className="hidden sm:flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded touch-friendly flex items-center justify-center ${
                  viewMode === "grid"
                    ? "bg-brown text-white"
                    : "bg-beige text-white hover:bg-brown/80"
                }`}
              >
                <div className="grid grid-cols-2 gap-1 w-3 h-3 sm:w-4 sm:h-4">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded touch-friendly flex items-center justify-center ${
                  viewMode === "list"
                    ? "bg-brown text-white"
                    : "bg-beige text-white hover:bg-brown/80"
                }`}
              >
                <div className="space-y-1 w-3 h-3 sm:w-4 sm:h-4">
                  <div className="bg-current rounded-sm h-0.5"></div>
                  <div className="bg-current rounded-sm h-0.5"></div>
                  <div className="bg-current rounded-sm h-0.5"></div>
                </div>
              </button>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || reportsLoading}
              className={`p-2 rounded touch-friendly flex items-center justify-center transition-colors duration-200 ${
                isRefreshing
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-gray-300 text-gray-600 hover:bg-gray-500 hover:text-white"
              }`}
              title={
                isRefreshing || reportsLoading
                  ? "Refreshing..."
                  : "Refresh reports"
              }
            >
              <RefreshCw
                className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
            </button>
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="mobile-input sm:w-auto text-sm flex items-center justify-between min-w-[140px] cursor-pointer hover:border-brown focus:border-brown focus:ring-brown/20"
              >
                <span className="flex items-center space-x-2">
                  {sortBy === "date" ? (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Sort by Date</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      <span>Sort by Address</span>
                    </>
                  )}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    sortDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {sortDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-beige rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => {
                      setSortBy("date");
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-brown/5 flex items-center space-x-2 first:rounded-t-lg transition-colors duration-150 ${
                      sortBy === "date"
                        ? "bg-brown/10 text-brown font-medium"
                        : "text-black"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Sort by Date</span>
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("address");
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-brown/5 flex items-center space-x-2 last:rounded-b-lg transition-colors duration-150 ${
                      sortBy === "address"
                        ? "bg-brown/10 text-brown font-medium"
                        : "text-black"
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Sort by Address</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {sortedReports.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <MapPin className="h-8 w-8 sm:h-12 sm:w-12 text-black/40 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-black mb-2">
            No reports found
          </h3>
          <p className="text-sm sm:text-base text-black/60 px-4">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Generate your first property report to get started"}
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
              : "space-y-3 sm:space-y-4"
          }
        >
          {sortedReports.map((report) => (
            <div
              key={report.id}
              className={
                viewMode === "grid"
                  ? "mobile-card hover:shadow-lg transition-shadow flex flex-col h-full"
                  : "mobile-card flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0"
              }
            >
              {viewMode === "grid" ? (
                <>
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex-1">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getStatusColor(
                            report.status
                          )}`}
                        >
                          {getStatusText(report.status)}
                        </span>
                        <h3
                          className="text-sm sm:text-base font-medium text-black mb-1 overflow-hidden leading-5"
                          title={report.address}
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical" as const,
                            wordBreak: "break-word",
                            hyphens: "auto",
                          }}
                        >
                          {formatFilenameToAddress(report.address)}
                        </h3>
                        <p className="text-xs sm:text-sm text-black/60 flex items-center">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {formatDate(report.generatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {report.status === "completed" && (
                      <>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleViewPdf(report)}
                            disabled={loadingUrls.has(report.id)}
                            className="flex-1 bg-transparent border border-brown text-black hover:bg-brown hover:text-white font-medium px-6 py-1 rounded-lg transition-all duration-200 text-xs font-bold flex items-center justify-center disabled:opacity-50 touch-manipulation select-none"
                          >
                            <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                            {loadingUrls.has(report.id) ? "Loading..." : "View"}
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(report)}
                            disabled={loadingUrls.has(report.id)}
                            className="flex-1 btn-primary py-1 text-xs font-bold flex items-center justify-center disabled:opacity-50 touch-manipulation select-none"
                          >
                            <Download className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                            {loadingUrls.has(report.id)
                              ? "Loading..."
                              : "Download"}
                          </button>
                          <button
                            onClick={() => {
                              console.log(
                                "[DELETE] Delete button clicked for report:",
                                {
                                  id: report.id,
                                  s3Key: report.s3Key,
                                  address: report.address,
                                  status: report.status,
                                }
                              );
                              openDeleteModal(report.id, report.s3Key);
                            }}
                            disabled={loadingUrls.has(report.id)}
                            className="py-px px-2 text-xs bg-white border border-red-600 text-red-600 hover:bg-red-500 hover:text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center touch-manipulation sm:py-2 sm:px-3 sm:text-sm sm:rounded-lg"
                            title="Delete report"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleShareReport(report)}
                          disabled={loadingUrls.has(report.id)}
                          className="w-full bg-beige hover:bg-beige/80 text-black font-medium px-6 py-2 rounded-lg transition-all duration-200 text-xs font-bold flex items-center justify-center disabled:opacity-50 touch-manipulation select-none"
                        >
                          <Share className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                          {loadingUrls.has(report.id) ? "Loading..." : "Share"}
                        </button>
                      </>
                    )}
                    {report.status === "generating" && (
                      <div className="w-full py-2">
                        <ProgressBar startTime={report.generatedAt} />
                      </div>
                    )}
                    {report.status === "error" && (
                      <div className="flex items-center justify-center space-x-2 w-full">
                        <button
                          onClick={() => {
                            console.log(
                              "[DELETE] Delete button clicked for report:",
                              {
                                id: report.id,
                                s3Key: report.s3Key,
                                address: report.address,
                                status: report.status,
                              }
                            );
                            openDeleteModal(report.id, report.s3Key);
                          }}
                          disabled={loadingUrls.has(report.id)}
                          className="flex-1 btn-danger py-2 text-sm flex items-center justify-center disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // List
                <>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          report.status
                        )}`}
                      >
                        {getStatusText(report.status)}
                      </span>
                      <span className="text-sm text-black/60">
                        {formatDate(new Date(report.generatedAt.getTime()))}
                      </span>
                    </div>
                    <h3
                      className="font-medium text-black overflow-hidden leading-5"
                      title={report.address}
                      style={{
                        maxWidth: "calc(100% - 10rem)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                        wordBreak: "break-word",
                        hyphens: "auto",
                      }}
                    >
                      {formatFilenameToAddress(report.address)}
                    </h3>
                  </div>
                  <div className="flex flex-col gap-2">
                    {report.status === "completed" && (
                      <>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleViewPdf(report)}
                            disabled={loadingUrls.has(report.id)}
                            className="bg-transparent border border-brown text-gray-600 hover:bg-brown hover:text-white font-medium px-2 py-1 rounded-lg transition-all duration-200 text-xs font-bold flex items-center disabled:opacity-50 touch-manipulation select-none"
                          >
                            <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                            {loadingUrls.has(report.id) ? "Loading..." : "View"}
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(report)}
                            disabled={loadingUrls.has(report.id)}
                            className="btn-primary py-1 px-2 text-xs font-bold flex items-center disabled:opacity-50 touch-manipulation select-none"
                          >
                            <Download className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                            {loadingUrls.has(report.id)
                              ? "Loading..."
                              : "Download"}
                          </button>
                          <button
                            onClick={() => {
                              console.log(
                                "[DELETE] Delete button clicked for report:",
                                {
                                  id: report.id,
                                  s3Key: report.s3Key,
                                  address: report.address,
                                  status: report.status,
                                }
                              );
                              openDeleteModal(report.id, report.s3Key);
                            }}
                            disabled={loadingUrls.has(report.id)}
                            className="sm:p-2 sm:text-red-600 sm:hover:bg-red-50 sm:rounded-lg sm:transition-colors touch-friendly bg-white border border-red-600 text-red-600 hover:bg-red-500 hover:text-white font-medium py-1 px-3 rounded-lg transition-all duration-200 flex items-center justify-center"
                            title="Delete report"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleShareReport(report)}
                          disabled={loadingUrls.has(report.id)}
                          className="w-full bg-beige hover:bg-beige/80 text-black font-medium px-6 py-2 rounded-lg transition-all duration-200 text-xs font-bold flex items-center justify-center disabled:opacity-50 touch-manipulation select-none"
                        >
                          <Share className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                          {loadingUrls.has(report.id) ? "Loading..." : "Share"}
                        </button>
                      </>
                    )}
                    {report.status === "generating" && (
                      <div className="w-full space-y-2">
                        <ProgressBar
                          startTime={new Date(report.generatedAt.getTime())}
                        />
                      </div>
                    )}
                    {report.status === "error" && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            console.log(
                              "[DELETE] Delete button clicked for report:",
                              {
                                id: report.id,
                                s3Key: report.s3Key,
                                address: report.address,
                                status: report.status,
                              }
                            );
                            openDeleteModal(report.id, report.s3Key);
                          }}
                          disabled={loadingUrls.has(report.id)}
                          className="btn-danger py-2 px-3 text-xs sm:text-sm flex items-center disabled:opacity-50 touch-friendly"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
