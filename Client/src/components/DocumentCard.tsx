import { FileText, Download, Eye, Calendar, MapPin } from "lucide-react";
import { formatFilenameToAddress, truncateText } from "../lib/addressFormat";

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
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Use formatFilenameToAddress for both display name and location
  const formattedAddress = doc.filename ? formatFilenameToAddress(doc.filename) : null;
  const rawDisplayName = formattedAddress || doc.filename || `Document ${doc.id.slice(0, 8)}`;
  const displayName = truncateText(rawDisplayName, 40);
  
  // Use formatted address from filename, or fall back to manual construction
  const rawLocation = formattedAddress || 
    (doc.address ? `${doc.address}${doc.city ? `, ${doc.city}` : ''}${doc.state ? `, ${doc.state}` : ''}` : null);
  const location = rawLocation ? truncateText(rawLocation, 50) : null;

  return (
    <div className="border rounded-lg shadow-sm bg-white hover:shadow-md transition p-4">
      {/* Header with icon and status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 text-brown">
            <FileText size={24} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-medium truncate text-sm" title={displayName}>
              {displayName}
            </p>
            {doc.report_type && (
              <p className="text-xs text-gray-500 capitalize">
                {doc.report_type} Report
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Location */}
      {location && (
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={14} className="text-gray-400 flex-shrink-0" />
          <p className="text-sm text-gray-600 truncate" title={location}>
            {location}
          </p>
        </div>
      )}

      {/* Creation date */}
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={14} className="text-gray-400 flex-shrink-0" />
        <p className="text-sm text-gray-600">
          Created {formatDate(doc.created_at)}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {onView && (
          <button
            onClick={() => onView(doc)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-brown text-white rounded hover:bg-brown/90 transition"
          >
            <Eye size={16} />
            View
          </button>
        )}
        {onDownload && (
          <button
            onClick={() => onDownload(doc)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-brown text-brown rounded hover:bg-brown/5 transition"
          >
            <Download size={16} />
            Download
          </button>
        )}
      </div>
    </div>
  );
}
