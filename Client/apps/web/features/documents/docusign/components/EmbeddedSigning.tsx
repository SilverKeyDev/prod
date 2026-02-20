import { useEffect, useState } from "react";

import { AlertCircle } from "lucide-react";

import { useDocusignActions } from "packages/hooks/data/documents/useDocusignActions";
import { useUIStore } from "packages/store";

import { BodyText, KeyTurnLoader } from "@/components/ui/index.web";

type EmbeddedSigningProps = {
  agreementId: string;
  participantId: string;
  onComplete?: () => void;
  height?: string;
};

/**
 * EmbeddedSigning Component
 *
 * Displays DocuSign embedded signing iframe
 * Fetches signing URL and handles completion callback
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

  // Listen for DocuSign completion event
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin is from DocuSign
      if (event.origin.includes("docusign")) {
        // DocuSign sends completion event
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

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onComplete, enqueueToast]);

  if (isGettingSigningUrl) {
    return (
      <div className="flex items-center justify-center py-12">
        <KeyTurnLoader message="Loading signing interface..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <BodyText size="md" className="text-gray-900 mb-2">
          Unable to Load Signing Interface
        </BodyText>
        <BodyText size="sm" muted>
          {error}
        </BodyText>
      </div>
    );
  }

  if (!signingUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
        <BodyText size="sm" muted>
          No signing URL available
        </BodyText>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <BodyText size="sm" className="text-blue-900">
          Please review and sign the document below. Your signature will be
          legally binding.
        </BodyText>
      </div>
      <iframe
        src={signingUrl}
        style={{ width: "100%", height, border: "none" }}
        title="DocuSign Signing Interface"
        className="rounded-lg border border-gray-300"
      />
    </div>
  );
}
