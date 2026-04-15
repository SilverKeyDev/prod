import { StyleSheet } from "react-native";
import WebView from "react-native-webview";

import { useEmbeddedSigningUrlQuery } from "packages/features/documents/hooks/data/useEmbeddedSigningUrlQuery";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useUIStore } from "packages/store";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader";
import { Box } from "packages/ui/components/primitives";

import { DocuSignLegalNotice } from "./DocuSignLegalNotice";
import ViewSignedDocument from "./ViewSignedDocument";

/**
 * Props for the EmbeddedSigning component (React Native).
 */
type EmbeddedSigningProps = {
  /**
   * Unique identifier for the agreement to sign.
   */
  agreementId: string;

  /**
   * Unique identifier for the participant who will sign.
   * Must match a participant in the agreement's participant list.
   */
  participantId: string;

  /**
   * Optional callback invoked when signing completes successfully.
   * Triggered by DocuSign's postMessage event after the signer finishes.
   */
  onComplete?: () => void;

  /**
   * Title for the PDF viewer when embedded signing is unavailable (same viewer as signed documents).
   */
  pdfViewerTitle?: string;
};

/**
 * EmbeddedSigning Component (React Native)
 *
 * Displays the DocuSign embedded signing interface within a WebView.
 * Handles the complete signing flow:
 * 1. Fetches signing URL from backend
 * 2. Displays DocuSign signing interface in WebView
 * 3. Listens for completion events via WebView message handler
 * 4. Triggers callback and shows success toast
 *
 * The signing URL is temporary (expires after ~5 minutes of inactivity) and
 * single-use (cannot be reused after signing completes).
 *
 * @component
 *
 * @example
 * ```tsx
 * <EmbeddedSigning
 *   agreementId="agreement-123"
 *   participantId="participant-456"
 *   onComplete={() => {
 *     // Refresh agreement list
 *     refetchAgreements();
 *     // Or navigate away
 *     navigation.goBack();
 *   }}
 * />
 * ```
 */
export default function EmbeddedSigning({
  agreementId,
  participantId,
  onComplete,
  pdfViewerTitle,
}: EmbeddedSigningProps) {
  const {
    data: signingUrl,
    isPending,
    isError,
  } = useEmbeddedSigningUrlQuery(agreementId, participantId);
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  const showPdfFallback = !isPending && (isError || !signingUrl);

  // Handle messages from DocuSign WebView
  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      // DocuSign sends postMessage events - parse the data
      const data = event.nativeEvent.data;

      // Handle string messages
      if (data === "signing_complete") {
        enqueueToast({
          type: "success",
          message: "Document signed successfully!",
        });
        if (onComplete) {
          onComplete();
        }
        return;
      }

      // Try parsing as JSON for structured messages
      try {
        const parsedData = JSON.parse(data);
        if (
          parsedData.event === "signing_complete" ||
          parsedData === "signing_complete"
        ) {
          enqueueToast({
            type: "success",
            message: "Document signed successfully!",
          });
          if (onComplete) {
            onComplete();
          }
        }
      } catch {
        // Not JSON, ignore
      }
    } catch (err) {
      log.error(LOG_CATEGORIES.ERRORS, "Error handling WebView message", err);
    }
  };

  // Loading state while fetching signing URL
  if (isPending) {
    return (
      <Box style={styles.centerContainer}>
        <KeyTurnLoader message="Loading signing interface..." />
      </Box>
    );
  }

  if (showPdfFallback) {
    return (
      <Box style={styles.pdfFallback}>
        <ViewSignedDocument
          agreementId={agreementId}
          title={pdfViewerTitle ?? "Agreement document"}
        />
      </Box>
    );
  }

  // Render signing WebView with legal notice
  return (
    <Box style={styles.container}>
      <DocuSignLegalNotice variant="embedded_signing" />
      <WebView
        source={{ uri: signingUrl }}
        onMessage={handleMessage}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <Box style={styles.centerContainer}>
            <KeyTurnLoader message="Loading document..." />
          </Box>
        )}
      />
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  pdfFallback: {
    flex: 1,
    minHeight: 400,
    width: "100%",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
  },
  webview: {
    flex: 1,
  },
});
