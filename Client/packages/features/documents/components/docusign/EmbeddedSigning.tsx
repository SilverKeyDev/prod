import { useEffect } from "react";

import { useEmbeddedSigningUrlQuery } from "packages/features/documents/hooks/data/docusign/useEmbeddedSigningUrlQuery";
import { useUIStore } from "packages/store";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader";
import { Box } from "packages/ui/components/primitives";
import { getWindow } from "packages/utils/platform";

import { DocuSignLegalNotice } from "./DocuSignLegalNotice";
import ViewSignedDocument from "./ViewSignedDocument";

/**
 * Props for the EmbeddedSigning component.
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
   * Height of the signing iframe (default: "600px").
   * Adjust based on document length and available viewport space.
   */
  height?: string;

  /**
   * Title for the PDF viewer when embedded signing is unavailable (same viewer as signed documents).
   */
  pdfViewerTitle?: string;
};

/**
 * EmbeddedSigning Component
 *
 * Displays the DocuSign embedded signing interface within an iframe.
 * Handles the complete signing flow:
 * 1. Fetches signing URL from backend
 * 2. Displays DocuSign signing interface
 * 3. Listens for completion events via postMessage
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
 *     navigate('/agreements');
 *   }}
 *   height="700px"
 * />
 * ```
 */
export default function EmbeddedSigning({
  agreementId,
  participantId,
  onComplete,
  height = "600px",
  pdfViewerTitle,
}: EmbeddedSigningProps) {
  const {
    data: signingUrl,
    isPending,
    isError,
  } = useEmbeddedSigningUrlQuery(agreementId, participantId);
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  const showPdfFallback = !isPending && (isError || !signingUrl);

  // Listen for DocuSign completion event via postMessage
  // DocuSign iframe sends this event when signing is complete
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: Verify origin is from DocuSign domain
      if (event.origin.includes("docusign")) {
        // DocuSign sends completion event in various formats
        if (event.data === "signing_complete" || event.data?.event === "signing_complete") {
          enqueueToast({
            type: "success",
            message: "Document signed successfully!",
          });
          if (onComplete) {
            onComplete();
          }
        }
      }
    };

    const win = getWindow();
    if (win) win.addEventListener("message", handleMessage);
    return () => {
      if (win) win.removeEventListener("message", handleMessage);
    };
  }, [onComplete, enqueueToast]);

  // Loading state while fetching signing URL
  if (isPending) {
    return (
      <Box className="flex items-center justify-center py-12">
        <KeyTurnLoader message="Loading signing interface..." />
      </Box>
    );
  }

  if (showPdfFallback) {
    return (
      <ViewSignedDocument
        agreementId={agreementId}
        title={pdfViewerTitle ?? "Agreement document"}
        height={height}
      />
    );
  }

  // Render signing iframe with legal notice
  return (
    <Box className="w-full">
      <DocuSignLegalNotice variant="embedded_signing" />
      <iframe
        src={signingUrl}
        style={{ width: "100%", height, border: "none" }}
        title="DocuSign Signing Interface"
        className="border-border rounded-lg border"
      />
    </Box>
  );
}
