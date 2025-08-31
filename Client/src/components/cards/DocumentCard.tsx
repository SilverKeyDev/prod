import { FileText } from "lucide-react";
import { useDocumentActions } from "../../hooks/useDocumentActions";
import PdfModal from "../modals/PdfModal";
import {
  CardDownloadButton,
  CardViewButton,
  CardHeader,
  CardDateDisplay,
} from "./base";

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

  // Extract address from primary_address or fallback to filename
  const extractAddressFromFilename = (filename: string): string => {
    // Remove file extension and user ID prefix
    const nameWithoutExt = filename.replace(/\.pdf$/, "");
    const parts = nameWithoutExt.split("_");

    // Skip the first part (user ID hash) and rejoin the rest
    if (parts.length > 1) {
      return parts.slice(1).join(" ").replace(/_/g, " ");
    }
    return filename;
  };

  const primaryAddress =
    doc.primary_address || extractAddressFromFilename(doc.filename);
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
      <div className="card-standard card-header-spacing">
        {/* Header with icon and status */}
        <CardHeader
          icon={FileText}
          title={fullDisplayName}
          subtitle={doc.report_type ? `${doc.report_type} Report` : undefined}
          action={
            <CardDownloadButton
              onClick={handleDownload}
              loading={isLoading}
              size="sm"
              variant="ghost"
              showIcon={true}
              text=""
            />
          }
        />

        {/* Creation date */}
        <CardDateDisplay
          date={doc.created_at}
          label="Created"
          size="xs"
          className="mb-3 sm:mb-4"
        />

        {/* View Document button */}
        <CardViewButton
          onClick={handleView}
          loading={isLoading}
          size="md"
          variant="muted"
          text="View Document"
          iconType="eye"
          className="w-full"
        />
      </div>
    </>
  );
}
