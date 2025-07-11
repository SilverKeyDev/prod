import { useState, useEffect } from "react";
import { Check, Loader2, BarChart2, RefreshCw } from "lucide-react";
import ErrorToast from "../components/ErrorToast";
import SuccessToast from "../components/SuccessToast";

interface Report {
  id: string;
  address: string;
  status: 'generating' | 'completed' | 'failed';
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
  // Add more fields as needed
}

export default function CompareReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReports, setSelectedReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/api/v1/report/all`, {
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
      } else {
        throw new Error('Failed to load reports');
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };
  // Fetch user's reports
  useEffect(() => {
    fetchReports();
  }, []);

  const toggleReportSelection = (report: Report, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedReports(prev => {
      const isSelected = prev.some(r => r.id === report.id);
      if (isSelected) {
        return prev.filter(r => r.id !== report.id);
      } else if (prev.length < 5) { // Limit to 5 comparisons
        return [...prev, report];
      } else {
        setToastMessage("You can compare up to 5 properties at a time");
        setShowError(true);
        return prev;
      }
    });
  };

  const refreshReports = async () => {
    setIsLoading(true);
    try {
      fetchReports();
      setToastMessage("Reports refreshed successfully");
      setShowSuccess(true);
    } catch (error) {
      console.error("Failed to refresh reports:", error);
      setError(error instanceof Error ? error.message : 'Failed to refresh reports');
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
          Select 2-5 properties to compare their details side by side
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
            <h2 className="text-xl font-medium text-navy">Your Property Reports</h2>
            <p className="text-sm text-navy/60 mt-1">
              {selectedReports.length} of {reports.length} selected
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={refreshReports}
              disabled={isLoading}
              className="flex items-center px-4 py-2 text-sm font-medium text-navy bg-beige/30 hover:bg-beige/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
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
            <p>Failed to load reports. Please try again.</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <BarChart2 className="h-12 w-12 mx-auto text-navy/30 mb-4" />
            <h3 className="text-lg font-medium text-navy mb-2">No reports found</h3>
            <p className="text-navy/60 mb-6">Generate your first property report to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => {
              const isSelected = selectedReports.some(r => r.id === report.id);
              return (
                <div
                  key={report.id}
                  onClick={(e) => toggleReportSelection(report, e)}
                  onMouseDown={(e) => e.preventDefault()} // Prevent focus/highlight on click
                  className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 select-none ${
                    isSelected
                      ? 'border-olive bg-olive/5 ring-2 ring-olive/30'
                      : 'border-gray-200 hover:border-olive/50 hover:bg-olive/5'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-1 min-w-0 pr-3">
                      <h3 className="text-sm font-medium text-navy truncate" title={report.address}>
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

      {selectedReports.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-navy/70">
            {selectedReports.length} {selectedReports.length === 1 ? 'property' : 'properties'} selected
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
