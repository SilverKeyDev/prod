import { FileText, Calendar, Download, Eye } from "lucide-react";
import { truncateText } from "../lib/addressFormat";

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
  /**
   * Optional callback for when document is clicked to view
   */
  onView?: (doc: DocumentData) => void;
  /**
   * Optional callback for when document is downloaded
   */
  onDownload?: (doc: DocumentData) => void;
}

/**
 * Enhanced document card component to display user documents with rich metadata.
 * Shows document info, location, creation date, and action buttons.
 */
export default function DocumentCard({ doc, onView, onDownload }: DocumentCardProps) {

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
  displayName = truncateText(displayName, 77);

  return (
    <div className="border rounded-lg shadow-sm bg-white hover:shadow-md transition p-4">
      {/* Header with icon and status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 text-brown">
            <FileText size={24} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-medium text-xs leading-tight line-clamp-2 h-8 flex items-center" title={displayName}>
              {displayName}
            </p>
            {doc.report_type && (
              <p className="text-xs text-gray-500 capitalize">
                {doc.report_type} Report
              </p>
            )}
          </div>
        </div>
        {/* Download button in top right */}
        <button
          onClick={() => onDownload?.(doc)}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Download"
        >
          <Download size={16} />
        </button>
      </div>

      {/* Creation date */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={14} className="text-gray-400 flex-shrink-0" />
        <p className="text-sm text-gray-600">
          Created {formatDate(doc.created_at)}
        </p>
      </div>

      {/* View Document button */}
      <button
        onClick={() => onView?.(doc)}
        className="w-full flex items-center justify-center gap-2 px-3 py-1 bg-gold text-white text-sm font-medium rounded hover:bg-gold/90 transition-colors"
      >
        <Eye size={16} />
        View Document
      </button>
    </div>
  );
}
