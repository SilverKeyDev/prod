import { useEffect, useState } from "react";

import { AlertCircle } from "lucide-react";

import { docusignApi } from "packages/features/documents/api/docusign";
import { useUIStore } from "packages/store";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader";
import { Box } from "packages/ui/components/primitives";
import { getWindow } from "packages/utils/platform";

import { BodyText, Button, Title } from "@/components/ui";

import { DocuSignLegalNotice } from "./DocuSignLegalNotice";

/**
 * Props for the ViewSignedDocument component.
 */
type ViewSignedDocumentProps = {
  /**
   * Unique identifier for the agreement whose signed document to display.
   */
  agreementId: string;

  /**
   * Optional title to display above the document viewer.
   */
  title?: string;

  /**
   * Optional height of the document viewer (default: "800px").
   */
  height?: string;

  /**
   * Optional callback when user closes/dismisses the viewer.
   */
  onClose?: () => void;
};

/**
 * ViewSignedDocument Component (Web)
 *
 * Displays a completed, signed PDF document from DocuSign.
 * Uses the browser's built-in PDF viewer via an iframe.
 *
 * Features:
 * - Fetches pre-signed S3 URL from backend
 * - Displays PDF in browser's native viewer
 * - Provides download button for offline access
 * - Handles loading and error states
 *
 * The document URL is temporary (pre-signed S3 URL, typically valid for 1 hour)
 * and is only accessible for completed agreements with signed documents.
 *
 * @component
 *
 * @example
 * ```tsx
 * <ViewSignedDocument
 *   agreementId="agreement-123"
 *   title="Purchase Offer - Signed"
 *   height="900px"
 *   onClose={() => navigate('/agreements')}
 * />
 * ```
 */
export default function ViewSignedDocument({
  agreementId,
  title = "Signed Document",
  height = "800px",
  onClose,
}: ViewSignedDocumentProps) {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  // Fetch document download URL on mount
  useEffect(() => {
    const fetchDocumentUrl = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get pre-signed download URL from backend
        const response = await docusignApi.getDownloadUrl(agreementId);
        setDocumentUrl(response.download_url);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load document";
        setError(errorMessage);
        enqueueToast({
          type: "error",
          message: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchDocumentUrl();
  }, [agreementId, enqueueToast]);

  // Handle download button click
  const handleDownload = () => {
    if (documentUrl) {
      getWindow()?.open(documentUrl, "_blank");
    }
  };

  // Handle open in new tab
  const handleOpenExternal = () => {
    if (documentUrl) {
      getWindow()?.open(documentUrl, "_blank");
    }
  };

  // Loading state while fetching URL
  if (loading) {
    return (
      <Box className="flex items-center justify-center py-12">
        <KeyTurnLoader message="Loading document..." />
      </Box>
    );
  }

  // Error state if fetch failed
  if (error) {
    return (
      <Box className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="mb-3 h-12 w-12 text-red-500" />
        <Title size="md" className="mb-2">
          Unable to Load Document
        </Title>
        <BodyText size="sm" muted className="mb-4">
          {error}
        </BodyText>
        {onClose && (
          <Button variant="secondary" onClick={onClose} iconName="x">
            Close
          </Button>
        )}
      </Box>
    );
  }

  // Empty state if no URL available
  if (!documentUrl) {
    return (
      <Box className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="mb-3 h-12 w-12 text-gray-400" />
        <BodyText size="sm" muted>
          No document available
        </BodyText>
        {onClose && (
          <Button variant="secondary" onClick={onClose} className="mt-4" iconName="x">
            Close
          </Button>
        )}
      </Box>
    );
  }

  // Render PDF viewer with actions
  return (
    <Box className="flex w-full flex-col">
      {/* Header with title and actions */}
      <Box className="mb-4 flex items-center justify-between">
        <Title size="md">{title}</Title>
        <Box className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenExternal} iconName="external-link">
            Open in New Tab
          </Button>
          <Button variant="primary" size="sm" onClick={handleDownload} iconName="download">
            Download
          </Button>
          {onClose && (
            <Button variant="secondary" size="sm" onClick={onClose} iconName="x">
              Close
            </Button>
          )}
        </Box>
      </Box>

      <DocuSignLegalNotice variant="signed_document_complete" />

      {/* PDF viewer iframe */}
      <iframe
        src={documentUrl}
        style={{ width: "100%", height, border: "none" }}
        title="Signed Document Viewer"
        className="border-border rounded-lg border"
      />
    </Box>
  );
}
