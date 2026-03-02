import { useState } from "react";

import { CheckCircle2, FileSignature, Send } from "lucide-react";

import { BodyText } from "packages/ui/components/index.web";

import { AgreementDetailModal } from "@/features/documents/components/modals";
import type { AgreementStatus } from "@/features/documents/types/docusign";

import AgreementStatusBadge from "./AgreementStatusBadge";

type SystemMessageType = "agreement_sent" | "agreement_signed" | "agreement_completed";

type AgreementStatusMessageProps = {
  agreementId: string;
  agreementTitle: string;
  messageType: SystemMessageType;
  status: AgreementStatus;
  participantName?: string;
  timestamp: Date;
};

/**
 * AgreementStatusMessage Component
 *
 * System message showing automatic agreement status updates in messaging
 * Examples:
 * - "Agreement sent for signature: Buyer Representation Agreement"
 * - "John Doe signed the Purchase Offer"
 * - "Agreement completed: All parties have signed"
 */
export default function AgreementStatusMessage({
  agreementId,
  agreementTitle,
  messageType,
  status,
  participantName,
  timestamp,
}: AgreementStatusMessageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getIcon = () => {
    switch (messageType) {
      case "agreement_sent":
        return <Send className="h-4 w-4 text-blue-600" />;
      case "agreement_signed":
        return <FileSignature className="h-4 w-4 text-purple-600" />;
      case "agreement_completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
  };

  const getMessage = () => {
    switch (messageType) {
      case "agreement_sent":
        return `Agreement sent for signature: ${agreementTitle}`;
      case "agreement_signed":
        return participantName
          ? `${participantName} signed ${agreementTitle}`
          : `Agreement signed: ${agreementTitle}`;
      case "agreement_completed":
        return `Agreement completed: ${agreementTitle}`;
    }
  };

  return (
    <>
      <div className="my-3 flex justify-center">
        <div
          role="button"
          tabIndex={0}
          className="max-w-md cursor-pointer rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 transition-colors hover:bg-blue-100"
          onClick={() => setIsModalOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsModalOpen(true);
            }
          }}
        >
          <div className="mb-1 flex items-center gap-2">
            {getIcon()}
            <BodyText size="sm" className="text-gray-900">
              {getMessage()}
            </BodyText>
          </div>
          <div className="flex items-center justify-between gap-3">
            <AgreementStatusBadge status={status} size="sm" />
            <BodyText size="xs" muted>
              {timestamp.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </BodyText>
          </div>
        </div>
      </div>
      <AgreementDetailModal
        agreementId={agreementId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
