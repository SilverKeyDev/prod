import { useState, useEffect, useRef } from "react";
import {
  Search,
  Download,
  Eye,
  Copy,
  Calendar,
  MapPin,
  X,
  Trash2,
} from "lucide-react";
import ErrorToast from "../components/ErrorToast";
import SuccessToast from "../components/SuccessToast";

interface Report {
  id: string;
  address: string;
  generatedAt: Date;
  status: "completed" | "generating" | "failed";
  pdfUrl?: string | null;
  s3Key?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error(
    "❌ VITE_API_BASE_URL is not defined! Falling back to window.location.origin."
  );
}

export default function PastReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"date" | "address">("date");
  const [reports, setReports] = useState<Report[]>([]);
  const [currentPdf, setCurrentPdf] = useState<string | null>(null);
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
  const hasFetched = useRef(false);

  const fetchReports = async () => {
    try {
      const baseUrl = API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/api/v1/report/all`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        const parsed: Report[] = json.reports.map((r: any) => ({
          id: r.id,
          address: r.address,
          status: r.status,
          pdfUrl: r.pdfUrl ?? null,
          s3Key: r.s3Key ?? null,
          generatedAt: new Date(r.generatedAt * 1000),
        }));        
        setReports(parsed);
      }
    } catch (err) {
      console.error("Failed to fetch reports", err);
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
    let pdfUrl = report.pdfUrl;

    // If we don't have a URL or it's an S3 key, get a fresh presigned URL
    if (!pdfUrl && report.s3Key) {
      pdfUrl = await getFreshDownloadUrl(report.id);
      if (pdfUrl) {
        // Update the report with the fresh URL
        setReports((prev) =>
          prev.map((r) => (r.id === report.id ? { ...r, pdfUrl } : r))
        );
      }
    }

    if (pdfUrl) {
      openPdfModal(pdfUrl);
    } else {
      console.error("Failed to get PDF URL");
    }
  };

  const handleDownloadPdf = async (report: Report) => {
    let pdfUrl = report.pdfUrl;

    // If we don't have a URL or it's an S3 key, get a fresh presigned URL
    if (!pdfUrl && report.s3Key) {
      pdfUrl = await getFreshDownloadUrl(report.id);
      if (pdfUrl) {
        // Update the report with the fresh URL
        setReports((prev) =>
          prev.map((r) => (r.id === report.id ? { ...r, pdfUrl } : r))
        );
      }
    }

    if (pdfUrl) {
      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `${report.address
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error("Failed to get PDF URL for download");
    }
  };

  const openDeleteModal = (
    reportId: string,
    s3Key: string | null | undefined
  ) => {
    console.log('[DELETE] Open delete modal:', { reportId, s3Key });
    setReportToDelete({ id: reportId, s3Key });
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    console.log('[DELETE] Close delete modal');
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

      const responseData = await res.json().catch((e) => ({}));
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
      await fetchReports();
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

  const retryGeneration = async (reportId: string) => {
    try {
      const baseUrl = API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/api/v1/report/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reportId }),
      });

      if (!res.ok) {
        console.error("Retry failed with status", res.status);
      } else {
        fetchReports();
      }
    } catch (err) {
      console.error("Retry request failed", err);
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
      case "failed":
        return "text-red-600 bg-red-50";
      default:
        return "text-navy/60 bg-beige/20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "generating":
        return "Generating...";
      case "failed":
        return "Failed";
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

  const openPdfModal = (pdfUrl: string) => {
    setCurrentPdf(pdfUrl);
    document.body.style.overflow = "hidden";
  };

  const closePdfModal = () => {
    setCurrentPdf(null);
    document.body.style.overflow = "auto";
  };

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

  const PdfModal = () => {
    if (!currentPdf) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-medium">PDF Viewer</h3>
            <div className="flex space-x-2">
              <a
                href={currentPdf}
                download
                className="text-navy hover:text-navy-dark p-1"
                title="Download PDF"
              >
                <Download className="h-5 w-5" />
              </a>
              <button
                onClick={closePdfModal}
                className="text-navy hover:text-navy-dark p-1"
                aria-label="Close PDF viewer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={`${currentPdf}#toolbar=1&navpanes=1&view=FitH`}
              className="w-full h-full border-0"
              title="PDF Viewer"
              onError={(e) => {
                console.error("Error loading PDF:", e);
                const iframe = e.target as HTMLIFrameElement;
                iframe.contentDocument!.body.innerHTML = `
                  <div style="padding: 20px; text-align: center;">
                    <p>Unable to load PDF preview.</p>
                    <a href="${currentPdf}" download class="text-blue-600 underline">
                      Click here to download the PDF
                    </a>
                  </div>
                `;
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchReports();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <PdfModal />
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
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
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brown-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    reportToDelete &&
                    handleDeleteReport(reportToDelete.id, reportToDelete.s3Key)
                  }
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-navy mb-2">Past Reports</h1>
          <p className="text-navy/60">
            Manage and download your generated property reports
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <span className="text-sm text-navy/60">
            {filteredReports.length} report
            {filteredReports.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-navy/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 pr-4"
              placeholder="Search by address..."
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${
                  viewMode === "grid"
                    ? "bg-navy text-white"
                    : "bg-beige text-navy hover:bg-navy/10"
                }`}
              >
                <div className="grid grid-cols-2 gap-1 w-4 h-4">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${
                  viewMode === "list"
                    ? "bg-navy text-white"
                    : "bg-beige text-navy hover:bg-navy/10"
                }`}
              >
                <div className="space-y-1 w-4 h-4">
                  <div className="bg-current rounded-sm h-0.5"></div>
                  <div className="bg-current rounded-sm h-0.5"></div>
                  <div className="bg-current rounded-sm h-0.5"></div>
                </div>
              </button>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "address")}
              className="input-field"
            >
              <option value="date">Sort by Date</option>
              <option value="address">Sort by Address</option>
            </select>
          </div>
        </div>
      </div>

      {sortedReports.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-navy/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-navy mb-2">
            No reports found
          </h3>
          <p className="text-navy/60">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Generate your first property report to get started"}
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {sortedReports.map((report) => (
            <div
              key={report.id}
              className={
                viewMode === "grid"
                  ? "card hover:shadow-lg transition-shadow"
                  : "card flex items-center justify-between"
              }
            >
              {viewMode === "grid" ? (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getStatusColor(
                          report.status
                        )}`}
                      >
                        {getStatusText(report.status)}
                      </span>
                      <h3
                        className="font-medium text-navy mb-1 truncate overflow-hidden whitespace-nowrap max-w-[16rem]"
                        title={report.address}
                      >
                        {report.address}
                      </h3>
                      <p className="text-sm text-navy/60 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(report.generatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {report.status === "completed" && (
                      <>
                        <button
                          onClick={() => handleViewPdf(report)}
                          disabled={loadingUrls.has(report.id)}
                          className="flex-1 btn-secondary py-2 text-sm flex items-center justify-center disabled:opacity-50"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {loadingUrls.has(report.id) ? "Loading..." : "View"}
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(report)}
                          disabled={loadingUrls.has(report.id)}
                          className="flex-1 btn-primary py-2 text-sm flex items-center justify-center disabled:opacity-50"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {loadingUrls.has(report.id)
                            ? "Loading..."
                            : "Download"}
                        </button>
                        <button
                          onClick={() => {
                            console.log('[DELETE] Delete button clicked for report:', {
                              id: report.id,
                              s3Key: report.s3Key,
                              address: report.address,
                              status: report.status
                            });
                            openDeleteModal(report.id, report.s3Key);
                          }}
                          disabled={loadingUrls.has(report.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {report.status === "generating" && (
                      <div className="w-full text-center py-2">
                        <div className="shimmer w-full h-4 rounded mx-auto"></div>
                      </div>
                    )}
                    {report.status === "failed" && (
                      <button
                        onClick={() => retryGeneration(report.id)}
                        className="w-full btn-secondary py-2 text-sm flex items-center justify-center"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Retry
                      </button>
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
                      <span className="text-sm text-navy/60">
                        {formatDate(report.generatedAt)}
                      </span>
                    </div>
                    <h3 className="font-medium text-navy">{report.address}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {report.status === "completed" && (
                      <>
                        <button
                          onClick={() => handleViewPdf(report)}
                          disabled={loadingUrls.has(report.id)}
                          className="btn-secondary py-2 px-3 text-sm flex items-center disabled:opacity-50"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {loadingUrls.has(report.id) ? "Loading..." : "View"}
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(report)}
                          disabled={loadingUrls.has(report.id)}
                          className="btn-primary py-2 px-3 text-sm flex items-center disabled:opacity-50"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {loadingUrls.has(report.id)
                            ? "Loading..."
                            : "Download"}
                        </button>
                        <button
                          onClick={() => {
                            console.log('[DELETE] Delete button clicked for report:', {
                              id: report.id,
                              s3Key: report.s3Key,
                              address: report.address,
                              status: report.status
                            });
                            openDeleteModal(report.id, report.s3Key);
                          }}
                          disabled={loadingUrls.has(report.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {report.status === "generating" && (
                      <div className="shimmer w-24 h-8 rounded"></div>
                    )}
                    {report.status === "failed" && (
                      <button
                        onClick={() => retryGeneration(report.id)}
                        className="btn-secondary py-2 px-3 text-sm flex items-center"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Retry
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
