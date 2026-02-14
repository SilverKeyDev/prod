import { useState } from "react";
import { CheckCircle2, Send, FileSignature } from "lucide-react";
import { BodyText } from "../../../../components/ui";
import AgreementStatusBadge from "./AgreementStatusBadge";
import { AgreementDetailModal } from "../modals";
import type { AgreementStatus } from "../../../../../../packages/schemas/documents/docusign";

type SystemMessageType =
  | "agreement_sent"
  | "agreement_signed"
  | "agreement_completed";

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
        return <Send className="w-4 h-4 text-blue-600" />;
      case "agreement_signed":
        return <FileSignature className="w-4 h-4 text-purple-600" />;
      case "agreement_completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
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
      <div className="flex justify-center my-3">
        <div
          className="max-w-md px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex items-center gap-2 mb-1">
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
