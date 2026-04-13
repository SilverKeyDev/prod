import { useEffect, useRef } from "react";

import { AlertCircle } from "lucide-react-native";
import { StyleSheet } from "react-native";
import WebView from "react-native-webview";

import { color } from "packages/design-tokens";
import { useEmbeddedSigningUrlQuery } from "packages/features/documents/hooks/data/useEmbeddedSigningUrlQuery";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useUIStore } from "packages/store";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader";
import { Box } from "packages/ui/components/primitives";

import { BodyText } from "@/components/ui";

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
}: EmbeddedSigningProps) {
  const { data: signingUrl, isPending, isError, error } =
    useEmbeddedSigningUrlQuery(agreementId, participantId);
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const errorToastSentRef = useRef(false);

  useEffect(() => {
    errorToastSentRef.current = false;
  }, [agreementId, participantId]);

  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? "Failed to load signing interface"
        : null;

  useEffect(() => {
    if (!isError || !errorMessage || errorToastSentRef.current) return;
    errorToastSentRef.current = true;
    enqueueToast({
      type: "error",
      message: errorMessage,
    });
  }, [isError, errorMessage, enqueueToast]);

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

  // Error state if URL fetch failed
  if (errorMessage) {
    return (
      <Box style={styles.centerContainer}>
        <AlertCircle
          size={48}
          color={color("rose.DEFAULT")}
          style={styles.errorIcon}
        />
        <BodyText size="md" style={styles.errorTitle}>
          Unable to Load Signing Interface
        </BodyText>
        <BodyText size="sm" muted style={styles.errorMessage}>
          {errorMessage}
        </BodyText>
      </Box>
    );
  }

  // Empty state if no URL available (shouldn't normally happen)
  if (!signingUrl) {
    return (
      <Box style={styles.centerContainer}>
        <AlertCircle
          size={48}
          color={color("neutral.400")}
          style={styles.errorIcon}
        />
        <BodyText size="sm" muted>
          No signing URL available
        </BodyText>
      </Box>
    );
  }

  // Render signing WebView with legal notice
  return (
    <Box style={styles.container}>
      <Box style={styles.noticeContainer}>
        <BodyText size="sm" style={styles.noticeText}>
          Please review and sign the document below. Your signature will be
          legally binding.
        </BodyText>
      </Box>
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
  },
  noticeContainer: {
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color("blue.100"),
    backgroundColor: color("blue.50"),
    padding: 12,
  },
  noticeText: {
    color: color("blue.800"),
  },
  errorIcon: {
    marginBottom: 12,
  },
  errorTitle: {
    marginBottom: 8,
    color: color("neutral.900"),
    textAlign: "center",
  },
  errorMessage: {
    textAlign: "center",
  },
  webview: {
    flex: 1,
  },
});
