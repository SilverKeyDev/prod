import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Loader2, BarChart2, Home, RefreshCw, Download } from "lucide-react";
import { reportApi } from "../lib/api";
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
  const navigate = useNavigate();

  // Fetch user's reports
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true);
        const response = await reportApi.getReports();
        
        if (response.success && response.data?.reports) {
          // Mock data - replace with actual API data structure
          const mockReports = response.data.reports.map((report: any) => ({
            ...report,
            // Add mock data for demonstration
            price: Math.floor(Math.random() * 1000000) + 500000,
            squareFootage: Math.floor(Math.random() * 3000) + 1000,
            yearBuilt: Math.floor(Math.random() * 50) + 1970,
            propertyType: ['Single Family', 'Condo', 'Townhouse', 'Multi-Family'][Math.floor(Math.random() * 4)],
            estimatedValue: Math.floor(Math.random() * 1200000) + 300000,
            neighborhoodScore: Math.floor(Math.random() * 50) + 50, // 50-100
            schoolScore: Math.floor(Math.random() * 50) + 50, // 50-100
          }));
          
          setReports(mockReports);
          setError(null);
        } else {
          throw new Error(response.error || 'Failed to load reports');
        }
      } catch (error) {
        console.error("Failed to fetch reports:", error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setShowError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  const toggleReportSelection = (report: Report) => {
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

  const generateNewReport = () => {
    navigate('/generate-report');
  };

  const refreshReports = async () => {
    setIsLoading(true);
    try {
      const response = await reportApi.getReports();
      if (response.success && response.data?.reports) {
        setReports(response.data.reports);
        setToastMessage("Reports refreshed successfully");
        setShowSuccess(true);
      }
    } catch (error) {
      console.error("Failed to refresh reports:", error);
      setError(error instanceof Error ? error.message : 'Failed to refresh reports');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Comparison fields to display
  const comparisonFields = [
    { key: 'address', label: 'Address' },
    { key: 'price', label: 'Price', format: (val: number) => `$${val.toLocaleString()}` },
    { key: 'estimatedValue', label: 'Estimated Value', format: (val: number) => `$${val.toLocaleString()}` },
    { key: 'squareFootage', label: 'Square Footage', format: (val: number) => val.toLocaleString() },
    { key: 'yearBuilt', label: 'Year Built' },
    { key: 'propertyType', label: 'Property Type' },
    { key: 'neighborhoodScore', label: 'Neighborhood Score', format: (val: number) => `${val}/100` },
    { key: 'schoolScore', label: 'School Score', format: (val: number) => `${val}/100` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif text-navy mb-4">
          Compare Properties
        </h1>
        <p className="text-lg text-navy/60 max-w-3xl mx-auto">
          Select up to 5 properties to compare their details side by side
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
          <h2 className="text-xl font-medium text-navy">Select Properties to Compare</h2>
          <div className="flex space-x-3">
            <button
              onClick={refreshReports}
              disabled={isLoading}
              className="flex items-center px-4 py-2 text-sm font-medium text-navy bg-beige/30 hover:bg-beige/50 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={generateNewReport}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-olive hover:bg-olive/90 rounded-lg transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Generate New Report
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
            <button
              onClick={generateNewReport}
              className="px-6 py-2 bg-olive text-white rounded-lg font-medium hover:bg-olive/90 transition-colors"
            >
              Generate Report
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => {
              const isSelected = selectedReports.some(r => r.id === report.id);
              return (
                <div
                  key={report.id}
                  onClick={() => toggleReportSelection(report)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-olive bg-olive/5 ring-2 ring-olive/30' 
                      : 'border-gray-200 hover:border-olive/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-navy">{report.address}</h3>
                      <p className="text-sm text-navy/60">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-olive text-white' : 'border-2 border-gray-300'
                    }`}>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                  {report.status === 'completed' && (
                    <div className="mt-3 flex justify-between text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Completed
                      </span>
                      <button 
                        className="text-olive hover:underline flex items-center text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle download
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison Table */}
      {selectedReports.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-medium text-navy">
              Comparing {selectedReports.length} {selectedReports.length === 1 ? 'Property' : 'Properties'}
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {comparisonFields.map((field, rowIndex) => (
                  <tr key={field.key} className={rowIndex % 2 === 0 ? 'bg-navy/5' : ''}>
                    <th className="text-left p-4 text-navy/80 font-medium border-r w-1/5">
                      {field.label}
                    </th>
                    {selectedReports.map((report, colIndex) => (
                      <td key={`${field.key}-${colIndex}`} className="p-4 border-r last:border-r-0">
                        {field.format 
                          ? field.format(report[field.key as keyof Report] as number)
                          : report[field.key as keyof Report]?.toString() || '-'}
                      </td>
                    ))}
                    {/* Fill empty cells if less than max selected */}
                    {Array.from({ length: 5 - selectedReports.length }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4 border-r last:border-r-0">-</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-navy/5 flex justify-end">
            <button
              onClick={() => setSelectedReports([])}
              className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
