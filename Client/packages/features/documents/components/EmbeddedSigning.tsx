import { useEffect, useState } from "react";

import { AlertCircle } from "lucide-react";

import { useDocusignActions } from "packages/features/documents/hooks/data/useDocusignActions";
import { useUIStore } from "packages/store";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader";
import { Box } from "packages/ui/components/primitives";
import { getWindow } from "packages/utils/platform";

import { BodyText } from "@/components/ui";

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
}: EmbeddedSigningProps) {
  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { getSigningUrl, isGettingSigningUrl } = useDocusignActions();
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  // Fetch signing URL on mount
  useEffect(() => {
    const fetchSigningUrl = async () => {
      try {
        const url = await getSigningUrl({ agreementId, participantId });
        if (url) {
          setSigningUrl(url);
        } else {
          setError("Unable to get signing URL");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load signing interface";
        setError(errorMessage);
        enqueueToast({
          type: "error",
          message: errorMessage,
        });
      }
    };

    void fetchSigningUrl();
  }, [agreementId, participantId, getSigningUrl, enqueueToast]);

  // Listen for DocuSign completion event via postMessage
  // DocuSign iframe sends this event when signing is complete
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: Verify origin is from DocuSign domain
      if (event.origin.includes("docusign")) {
        // DocuSign sends completion event in various formats
        if (
          event.data === "signing_complete" ||
          event.data?.event === "signing_complete"
        ) {
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
  if (isGettingSigningUrl) {
    return (
      <Box className="flex items-center justify-center py-12">
        <KeyTurnLoader message="Loading signing interface..." />
      </Box>
    );
  }

  // Error state if URL fetch failed
  if (error) {
    return (
      <Box className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="mb-3 h-12 w-12 text-red-500" />
        <BodyText size="md" className="mb-2 text-gray-900">
          Unable to Load Signing Interface
        </BodyText>
        <BodyText size="sm" muted>
          {error}
        </BodyText>
      </Box>
    );
  }

  // Empty state if no URL available (shouldn't normally happen)
  if (!signingUrl) {
    return (
      <Box className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="mb-3 h-12 w-12 text-gray-400" />
        <BodyText size="sm" muted>
          No signing URL available
        </BodyText>
      </Box>
    );
  }

  // Render signing iframe with legal notice
  return (
    <Box className="w-full">
      <Box className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <BodyText size="sm" className="text-blue-900">
          Please review and sign the document below. Your signature will be
          legally binding.
        </BodyText>
      </Box>
      <iframe
        src={signingUrl}
        style={{ width: "100%", height, border: "none" }}
        title="DocuSign Signing Interface"
        className="rounded-lg border border-gray-300"
      />
    </Box>
  );
}
