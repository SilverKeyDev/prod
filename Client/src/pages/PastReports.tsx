import React, { useState, useEffect, useRef } from "react";
import { Search, Download, Eye, Copy, Calendar, MapPin, X } from "lucide-react";
import { User } from "../types/index.ts";

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

interface Report {
  id: string;
  address: string;
  generatedAt: Date;
  status: "completed" | "generating" | "failed";
  pdfUrl?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL


if (!API_BASE_URL) {
  console.error("❌ VITE_API_BASE_URL is not defined! Falling back to window.location.origin.");
}

export default function PastReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"date" | "address">("date");
  const [reports, setReports] = useState<Report[]>([]);
  const [currentPdf, setCurrentPdf] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchReports = async () => {
    try {
      const baseUrl = API_BASE_URL || '';
      const res = await fetch(`${baseUrl}/api/v1/report/all`, {
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        const parsed: Report[] = json.reports.map((r: any) => ({
          id: r.id,
          address: r.address,
          status: r.status,
          pdfUrl: r.pdfUrl,
          generatedAt: new Date(r.generatedAt * 1000),
        }));
        setReports(parsed);
      }
    } catch (err) {
      console.error("Failed to fetch reports", err);
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchReports();
  }, []);

  const retryGeneration = async (reportId: string) => {
    try {
      const baseUrl = API_BASE_URL || '';
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
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
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
            <button
              onClick={closePdfModal}
              className="text-navy hover:text-navy-dark"
              aria-label="Close PDF viewer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={currentPdf}
              className="w-full h-full"
              title="PDF Viewer"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PdfModal />
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
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "address")}
              className="input-field py-2"
            >
              <option value="date">Sort by Date</option>
              <option value="address">Sort by Address</option>
            </select>
            <div className="flex items-center bg-beige/20 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-navy shadow-sm"
                    : "text-navy/60 hover:text-navy"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-navy shadow-sm"
                    : "text-navy/60 hover:text-navy"
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>
      {sortedReports.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-beige/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-navy/40" />
          </div>
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
              className={`card hover:shadow-lg transition-all duration-200 ${
                viewMode === "list" ? "flex items-center justify-between" : ""
              }`}
            >
              {/* Grid */}
              {viewMode === "grid" ? (
                <>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {getStatusText(report.status)}
                      </span>
                      <span className="text-sm text-navy/60 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(report.generatedAt)}
                      </span>
                    </div>
                    <h3 className="font-medium text-navy mb-1">{report.address}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {report.status === "completed" && (
                      <>
                        <button
                          onClick={() => openPdfModal(report.pdfUrl!)}
                          className="flex-1 btn-secondary py-2 text-sm flex items-center justify-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                        <a
                          href={report.pdfUrl}
                          download={`${report.address.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`}
                          className="flex-1 btn-primary py-2 text-sm flex items-center justify-center"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
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
                          onClick={() => openPdfModal(report.pdfUrl!)}
                          className="btn-secondary py-2 px-3 text-sm flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                        <a
                          href={report.pdfUrl}
                          download={`${report.address.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`}
                          className="btn-primary py-2 px-3 text-sm flex items-center"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
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