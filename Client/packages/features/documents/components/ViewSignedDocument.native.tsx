import { useEffect, useState } from "react";

import { AlertCircle, ExternalLink } from "lucide-react-native";
import { Linking, StyleSheet } from "react-native";
import Pdf from "react-native-pdf";

import { color } from "packages/design-tokens";
import { docusignApi } from "packages/features/documents/api/docusign";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useUIStore } from "packages/store";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Button, Title } from "@/components/ui";

/**
 * Props for the ViewSignedDocument component (React Native).
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
   * Optional callback when user closes/dismisses the viewer.
   */
  onClose?: () => void;
};

/**
 * ViewSignedDocument Component (React Native)
 *
 * Displays a completed, signed PDF document from DocuSign.
 * Uses react-native-pdf for PDF rendering on mobile devices.
 *
 * Features:
 * - Fetches pre-signed S3 URL from backend
 * - Displays PDF with native PDF viewer
 * - Provides download/share functionality
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
 *   onClose={() => navigation.goBack()}
 * />
 * ```
 */
export default function ViewSignedDocument({
  agreementId,
  title = "Signed Document",
  onClose,
}: ViewSignedDocumentProps) {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
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
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load document";
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

  // Handle PDF load error
  const handlePdfError = (err: Error) => {
    log.error(LOG_CATEGORIES.ERRORS, "PDF load error", err);
    setPdfError(err.message || "Failed to load PDF");
    enqueueToast({
      type: "error",
      message: "Failed to load PDF document",
    });
  };

  // Handle open in external browser/PDF viewer
  const handleOpenExternal = async () => {
    if (documentUrl) {
      try {
        const supported = await Linking.canOpenURL(documentUrl);
        if (supported) {
          await Linking.openURL(documentUrl);
        } else {
          enqueueToast({
            type: "error",
            message: "Cannot open document URL",
          });
        }
      } catch (err) {
        log.error(LOG_CATEGORIES.ERRORS, "Error opening URL", err);
        enqueueToast({
          type: "error",
          message: "Failed to open document",
        });
      }
    }
  };

  // Loading state while fetching URL
  if (loading) {
    return (
      <Box style={styles.centerContainer}>
        <KeyTurnLoader message="Loading document..." />
      </Box>
    );
  }

  // Error state if fetch failed
  if (error) {
    return (
      <Box style={styles.centerContainer}>
        <AlertCircle
          size={48}
          color={color("rose.DEFAULT")}
          style={styles.errorIcon}
        />
        <Title size="md" style={styles.errorTitle}>
          Unable to Load Document
        </Title>
        <BodyText size="sm" muted style={styles.errorMessage}>
          {error}
        </BodyText>
        {onClose && (
          <Button variant="secondary" onPress={onClose} style={styles.button}>
            Close
          </Button>
        )}
      </Box>
    );
  }

  // Empty state if no URL available
  if (!documentUrl) {
    return (
      <Box style={styles.centerContainer}>
        <AlertCircle
          size={48}
          color={color("neutral.400")}
          style={styles.errorIcon}
        />
        <BodyText size="sm" muted>
          No document available
        </BodyText>
        {onClose && (
          <Button variant="secondary" onPress={onClose} style={styles.button}>
            Close
          </Button>
        )}
      </Box>
    );
  }

  // Render PDF viewer
  return (
    <Box style={styles.container}>
      {/* Header with title and actions */}
      <Box style={styles.header}>
        <Title size="md">{title}</Title>
        <Box style={styles.actions}>
          <Button
            variant="outline"
            size="sm"
            onPress={handleOpenExternal}
            style={styles.actionButton}
          >
            <ExternalLink size={16} color={color("neutral.900")} />
            <BodyText size="sm">Open External</BodyText>
          </Button>
          {onClose && (
            <Button variant="secondary" size="sm" onPress={onClose}>
              Close
            </Button>
          )}
        </Box>
      </Box>

      {/* Document notice */}
      <Box style={styles.noticeContainer}>
        <BodyText size="sm" style={styles.noticeText}>
          This document has been completed and signed. All signatures are
          legally binding.
        </BodyText>
      </Box>

      {/* PDF viewer or error */}
      {pdfError ? (
        <Box style={styles.centerContainer}>
          <AlertCircle
            size={48}
            color={color("rose.DEFAULT")}
            style={styles.errorIcon}
          />
          <BodyText size="sm" muted style={styles.errorMessage}>
            {pdfError}
          </BodyText>
          <Button
            variant="outline"
            size="sm"
            onPress={handleOpenExternal}
            style={styles.button}
          >
            Open in External Viewer
          </Button>
        </Box>
      ) : (
        <Pdf
          source={{ uri: documentUrl }}
          onError={handlePdfError}
          style={styles.pdf}
          trustAllCerts={false}
          enablePaging={true}
          spacing={10}
          horizontal={false}
        />
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  noticeContainer: {
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color("green.200"),
    backgroundColor: color("green.50"),
    padding: 12,
  },
  noticeText: {
    color: color("green.800"),
  },
  pdf: {
    flex: 1,
    backgroundColor: color("neutral.100"),
  },
  errorIcon: {
    marginBottom: 12,
  },
  errorTitle: {
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
});
