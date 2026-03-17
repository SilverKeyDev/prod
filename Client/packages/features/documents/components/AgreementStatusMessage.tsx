import { useState } from "react";

import { Icon } from "@ui/icons";

import { Box } from "packages/ui/components/primitives";

import { BodyText } from "@/components/ui";
import { AgreementDetailModal } from "@/features/documents/components/modals";
import type { AgreementStatus } from "@/features/documents/types/agreements";

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
        return <Icon name="send" className="h-4 w-4 text-blue-600" />;
      case "agreement_signed":
        return <Icon name="file-signature" className="h-4 w-4 text-purple-600" />;
      case "agreement_completed":
        return <Icon name="check-circle-2" className="text-accent h-4 w-4" />;
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
      <Box className="my-3 flex flex-row justify-center">
        <Box
          role="button"
          tabIndex={0}
          className="max-w-md cursor-pointer rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 hover:bg-blue-100 active:bg-blue-100 active:bg-blue-200"
          onClick={() => setIsModalOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsModalOpen(true);
            }
          }}
        >
          <Box className="mb-1 flex flex-row items-center gap-2">
            {getIcon()}
            <BodyText size="sm" className="text-text-primary">
              {getMessage()}
            </BodyText>
          </Box>
          <Box className="flex flex-row items-center justify-between gap-3">
            <AgreementStatusBadge status={status} size="sm" />
            <BodyText size="xs" muted>
              {timestamp.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </BodyText>
          </Box>
        </Box>
      </Box>
      <AgreementDetailModal
        agreementId={agreementId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
