import { FileText, Calendar, Download, Eye } from "lucide-react";
import { useDocumentActions } from "../../hooks/useDocumentActions";
import PdfModal from "../modals/PdfModal";

export interface DocumentData {
  id: string;
  filename: string;
  file_path: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  user_id: string;
  report_type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  primary_address: string;
  comparison_address?: string | null;
}

interface DocumentCardProps {
  /**
   * Document data from the backend
   */
  doc: DocumentData;
}

/**
 * Enhanced document card component to display user documents with rich metadata.
 * Shows document info, location, creation date, and action buttons.
 */
export default function DocumentCard({ doc }: DocumentCardProps) {
  const {
    loadingUrls,
    handleViewDocument,
    handleDownloadDocument,
    currentPdf,
    currentDocumentName,
    closePdfModal,
  } = useDocumentActions();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Extract address from primary_address or fallback to filename
  const extractAddressFromFilename = (filename: string): string => {
    // Remove file extension and user ID prefix
    const nameWithoutExt = filename.replace(/\.pdf$/, '');
    const parts = nameWithoutExt.split('_');
    
    // Skip the first part (user ID hash) and rejoin the rest
    if (parts.length > 1) {
      return parts.slice(1).join(' ').replace(/_/g, ' ');
    }
    return filename;
  };

  const primaryAddress = doc.primary_address || extractAddressFromFilename(doc.filename);
  let displayName = "";

  // If comparison report, format as 'Comparison: primary v comparison'
  if (doc.report_type === "comparison") {
    if (doc.comparison_address) {
      displayName = `Comparison: ${primaryAddress} v ${doc.comparison_address}`;
    } else {
      displayName = primaryAddress;
    }
  } else {
    displayName = primaryAddress;
  }
  // Don't truncate with character count - let CSS handle 2-line truncation
  const fullDisplayName = displayName;

  const isLoading = loadingUrls.has(doc.id);

  const handleView = () => {
    handleViewDocument(doc.id, fullDisplayName);
  };

  const handleDownload = () => {
    handleDownloadDocument(doc.id, fullDisplayName);
  };

  return (
    <>
      {currentPdf && (
        <PdfModal
          currentPdf={currentPdf}
          currentReportAddress={currentDocumentName}
          onClose={closePdfModal}
        />
      )}
      <div className="card-mobile space-responsive-sm">
      {/* Header with icon and status */}
      <div className="flex items-start justify-between gap-responsive-sm mb-2 sm:mb-3">
        <div className="flex items-center gap-responsive-sm flex-1 min-w-0">
          <div className="flex-shrink-0 text-brown">
            <FileText className="mobile-icon-md" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-medium text-responsive-xs leading-tight line-clamp-1 truncate" title={fullDisplayName}>
              {fullDisplayName}
            </p>
            {doc.report_type && (
              <p className="text-responsive-xs text-gray-500 capitalize mt-0.5 truncate">
                {doc.report_type} Report
              </p>
            )}
          </div>
        </div>
        {/* Download button in top right */}
        <button
          onClick={handleDownload}
          disabled={isLoading}
          className="flex-shrink-0 space-responsive-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          title="Download"
        >
          {isLoading ? (
            <div className="mobile-icon-xs border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <Download className="mobile-icon-sm" />
          )}
        </button>
      </div>

      {/* Creation date */}
      <div className="flex items-center gap-responsive-sm mb-3 sm:mb-4">
        <Calendar className="mobile-icon-xs text-gray-400 flex-shrink-0" />
        <p className="text-responsive-xs text-gray-600">
          Created {formatDate(doc.created_at)}
        </p>
      </div>

      {/* View Document button */}
      <button
        onClick={handleView}
        disabled={isLoading}
        className="w-full inline-flex items-center justify-center px-responsive-sm py-responsive-xs bg-gold text-white font-medium btn-text-responsive rounded-lg hover:bg-gold/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-friendly whitespace-nowrap"
      >
        {isLoading ? (
          <>
            <div className="mobile-icon-xs border-2 border-white/30 border-t-white rounded-full animate-spin mr-1 sm:mr-2" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            <Eye className="mobile-icon-xs mr-1 sm:mr-2" />
            <span>View Document</span>
          </>
        )}
      </button>
      </div>
    </>
  );
}
