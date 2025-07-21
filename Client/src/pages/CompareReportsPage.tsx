import { useState, useEffect } from "react";

import { Check, Loader2, BarChart2, RefreshCw } from "lucide-react";
import ErrorToast from "../components/ErrorToast";
import SuccessToast from "../components/SuccessToast";

interface Report {
  id: string;
  address: string;
  status: "generating" | "completed" | "failed";
  createdAt: string;
  updatedAt?: string;
  // Add more report fields as needed
  price?: number;
  squareFootage?: number;
  yearBuilt?: number;
  propertyType?: string;
  estimatedValue?: number;
  neighborhoodScore?: number;
  schoolScore?: number;
  s3Key?: string;
  // Add more fields as needed
}

const METRIC_KEYS: string[] = [
  "Neighborhood Vibe",
  "Community Events",
  "Neighborhood Rating",
  "Crime Rating",
  "Accessibility Rating",
  "Wheelchair Friendly",
  "Development",
  "Gentrification",
  "Culture Rating",
  "Seasonal Trends",
  "Environmental Rating",
  "Air Quality",
  "Internet Speed",
  "Social Rating",
  "Income Level",
  "Religiosity",
  "Financial Rating",
  "Monthly Rent",
  "Commute",
  "Family Rating",
  "Family Notes",
  "Nightlife Score",
  "Dating Scene",
  "Pet Friendly",
  "Cell Service",
];

export default function CompareReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReports, setSelectedReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [comparisonTable, setComparisonTable] = useState<any[]>([]);

  const fetchReports = async () => {
    const idToken = localStorage.getItem("id_token");
    try {
      setIsLoading(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/api/v1/report/almostall`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        credentials: "include",
      });
      const json = await res.json();

      if (json.success) {
        const parsed = json.reports.map((r: any) => ({
          id: r.id,
          address: r.address,
          status: r.status,
          pdfUrl: r.pdfUrl ?? null,
          s3Key: r.s3Key ?? null,
        }));
        setReports(parsed);
        setError(null);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };
  // Helper to compare
  // Fetch comparison data whenever selection changes (2-5 selected)
  const fetchComparison = async (keys: string[]) => {
    if (keys.length === 0) {
      setToastMessage("Select a report to view");
      setShowError(true);
      return;
    }
    try {
      setIsLoading(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/api/v1/report/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ s3Keys: keys }),
      });
      const json = await res.json();
      if (json.success) {
        console.log("Comparison table received:", json.table);
        setComparisonTable(json.table);
      } else {
        throw new Error(json.error || "Comparison failed");
      }
    } catch (error) {
      console.error(error);
      setToastMessage(
        error instanceof Error ? error.message : "Comparison failed"
      );
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Update comparison whenever selectedReports changes
  useEffect(() => {
    const toJsonKey = (key: string) => {
      if (!key) return "";

      // If it's already a JSON key, return it directly.
      if (key.endsWith(".json")) return key;

      // Otherwise, derive the JSON key from the PDF key.
      const baseName = key
        .replace(/^reports\//, "")
        .replace(/\.pdf$/, "");

      return `reports/${baseName}.json`;
    };
    const keys = selectedReports.map((r) => toJsonKey(r.s3Key || ""));
    if (keys.length > 0) {
      fetchComparison(keys);
    } else {
      setComparisonTable([]);
    }
  }, [selectedReports]);

  // Fetch user's reports
  useEffect(() => {
    fetchReports();
  }, []);

  const toggleReportSelection = (report: Report, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedReports((prev) => {
      const isSelected = prev.some((r) => r.id === report.id);
      if (isSelected) {
        return prev.filter((r) => r.id !== report.id);
      } else {
        return [...prev, report];
      }
    });
  };

  // Export comparison table to CSV
  const exportToExcel = () => {
    if (selectedReports.length === 0 || comparisonTable.length === 0) {
      setToastMessage("Select properties to export");
      setShowError(true);
      return;
    }
    const header = ["Metric", ...selectedReports.map((r) => r.address)];
    const sanitize = (str: string) =>
      (str || "").toLowerCase().replace(/\s+/g, "_");
    const rows = METRIC_KEYS.map((metric) => {
      const values = selectedReports.map((r) => {
        const row = comparisonTable.find(
          (item: any) => sanitize(item.Address) === sanitize(r.address)
        );
        return row ? (row as any)[metric] ?? "-" : "-";
      });
      return [metric, ...values];
    });
    const csvRows = [header, ...rows].map((r) =>
      r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "property_comparison.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const refreshReports = async () => {
    setIsLoading(true);
    try {
      fetchReports();
      setToastMessage("Reports refreshed successfully");
      setShowSuccess(true);
    } catch (error) {
      console.error("Failed to refresh reports:", error);
      setError(
        error instanceof Error ? error.message : "Failed to refresh reports"
      );
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif text-navy mb-4">
          Compare Properties
        </h1>
        <p className="text-lg text-navy/60 max-w-3xl mx-auto">
          Select properties to compare their details side by side
        </p>
      </div>

      {/* Error Toast */}
      {showError && (
        <ErrorToast
          message={toastMessage || error || "An error occurred"}
          onClose={() => setShowError(false)}
          duration={5000}
        />
      )}

      {/* Success Toast */}
      {showSuccess && (
        <SuccessToast
          message={toastMessage}
          onClose={() => setShowSuccess(false)}
          duration={3000}
        />
      )}

      {/* Reports Selection */}
      <div className="card p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-medium text-navy">
              Your Property Reports
            </h2>
            <p className="text-sm text-navy/60 mt-1">
              {selectedReports.length} of {reports.length} selected
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToExcel}
              disabled={
                selectedReports.length === 0 || comparisonTable.length === 0
              }
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-olive hover:bg-olive/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
            <button
              onClick={refreshReports}
              disabled={isLoading}
              className="flex items-center px-4 py-2 text-sm font-medium text-navy bg-beige/30 hover:bg-beige/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-navy" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-navy/60">
            <p>No reports yet</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <BarChart2 className="h-12 w-12 mx-auto text-navy/30 mb-4" />
            <h3 className="text-lg font-medium text-navy mb-2">
              No reports found
            </h3>
            <p className="text-navy/60 mb-6">
              Generate your first property report to get started
            </p>
          </div>
        ) : (
          <div
  className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${reports.length > 9 ? 'overflow-y-auto' : ''}`}
  style={reports.length > 9 ? { maxHeight: '13rem' } : {}}
>
            {reports.map((report) => {
              const isSelected = selectedReports.some(
                (r) => r.id === report.id
              );
              return (
                <div
                  key={report.id}
                  onClick={(e) => toggleReportSelection(report, e)}
                  onMouseDown={(e) => e.preventDefault()} // Prevent focus/highlight on click
                  className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 select-none ${
                    isSelected
                      ? "border-olive bg-olive/5 ring-2 ring-olive/30"
                      : "border-gray-200 hover:border-olive/50 hover:bg-olive/5"
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-1 min-w-0 pr-3">
                      <h3
                        className="text-sm font-medium text-navy truncate"
                        title={report.address}
                      >
                        {report.address}
                      </h3>
                    </div>
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <div className="h-5 w-5 rounded-full bg-olive flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-navy/30" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison Table */}
      <div className="mt-10 overflow-auto">
        <table className="min-w-full text-sm border divide-y divide-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-beige/30">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-navy sticky left-0 bg-beige/30">
                Metric
              </th>
              {selectedReports.map((r) => {
                const colWidth =
                  selectedReports.length >= 3
                    ? "min-w-[140px]"
                    : "min-w-[180px]";
                return (
                  <th
                    key={r.id}
                    className={`px-4 py-3 text-left font-semibold text-navy ${colWidth}`}
                  >
                    {r.address}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {METRIC_KEYS.map((metric) => (
              <tr key={metric} className="even:bg-white odd:bg-beige/10">
                <td className="px-4 py-2 font-medium text-navy sticky left-0 bg-white/60 backdrop-blur">
                  {metric}
                </td>
                {selectedReports.map((r) => {
                  const sanitize = (str: string) =>
                    (str || "").toLowerCase().replace(/\s+/g, "_");
                  const row = comparisonTable.find(
                    (item: any) =>
                      sanitize(item.Address) === sanitize(r.address)
                  );
                  const value = row ? (row as any)[metric] ?? "-" : "-";
                  const colWidth =
                    selectedReports.length >= 3
                      ? "min-w-[140px]"
                      : "min-w-[180px]";
                  return (
                    <td
                      key={r.id + metric}
                      className={`px-4 py-2 text-navy/90 whitespace-pre-wrap ${colWidth}`}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selection summary */}
      {true && (
        <div className="mt-6 text-center">
          <p className="text-navy/70">
            {selectedReports.length}{" "}
            {selectedReports.length === 1 ? "property" : "properties"} selected
          </p>
          <button
            onClick={() => setSelectedReports([])}
            className="mt-2 text-sm text-navy/70 hover:text-navy underline"
          >
            Clear selection
          </button>
        </div>
      )}
    </div>
  );
}