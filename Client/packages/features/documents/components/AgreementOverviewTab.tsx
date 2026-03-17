import { Box } from "packages/ui/components/primitives";

import { BodyText, Button } from "@/components/ui";

import AgreementStatusBadge from "./AgreementStatusBadge";
import VoidConfirmation from "./VoidConfirmation";

type AgreementOverviewTabProps = {
  agreement: {
    id: string;
    title: string;
    status: string;
    agreement_type: string;
    property_address?: string | null;
    created_at: string;
    sent_at?: string | null;
    completed_at?: string | null;
    voided_at?: string | null;
    void_reason?: string | null;
    description?: string | null;
  };
  userCanSend: boolean;
  userCanVoid: boolean;
  isSendingAgreement: boolean;
  isVoidingAgreement: boolean;
  showVoidConfirm: boolean;
  voidReason: string;
  onSend: () => void;
  onVoidClick: () => void;
  onVoidConfirm: () => void;
  onVoidCancel: () => void;
  onVoidReasonChange: (reason: string) => void;
};

/**
 * AgreementOverviewTab Component
 *
 * Displays agreement metadata, status, and primary actions
 */
export default function AgreementOverviewTab({
  agreement,
  userCanSend,
  userCanVoid,
  isSendingAgreement,
  isVoidingAgreement,
  showVoidConfirm,
  voidReason,
  onSend,
  onVoidClick,
  onVoidConfirm,
  onVoidCancel,
  onVoidReasonChange,
}: AgreementOverviewTabProps) {
  return (
    <Box className="flex flex-col gap-6">
      {/* Metadata */}
      <Box className="flex-two-cols-gap-4">
        <Box>
          <BodyText size="xs" muted className="mb-1">
            Agreement Type
          </BodyText>
          <BodyText size="sm">
            {agreement.agreement_type.charAt(0).toUpperCase() +
              agreement.agreement_type.slice(1).replace(/_/g, " ")}
          </BodyText>
        </Box>
        <Box>
          <BodyText size="xs" muted className="mb-1">
            Status
          </BodyText>
          <AgreementStatusBadge status={agreement.status} size="sm" />
        </Box>
        {agreement.property_address && (
          <Box className="w-full">
            <BodyText size="xs" muted className="mb-1">
              Property Address
            </BodyText>
            <BodyText size="sm">{agreement.property_address}</BodyText>
          </Box>
        )}
        <Box>
          <BodyText size="xs" muted className="mb-1">
            Created
          </BodyText>
          <BodyText size="sm">{agreement.created_at}</BodyText>
        </Box>
        {agreement.sent_at && (
          <Box>
            <BodyText size="xs" muted className="mb-1">
              Sent
            </BodyText>
            <BodyText size="sm">{agreement.sent_at}</BodyText>
          </Box>
        )}
        {agreement.completed_at && (
          <Box>
            <BodyText size="xs" muted className="mb-1">
              Completed
            </BodyText>
            <BodyText size="sm">{agreement.completed_at}</BodyText>
          </Box>
        )}
        {agreement.voided_at && (
          <Box className="w-full">
            <BodyText size="xs" muted className="mb-1">
              Voided
            </BodyText>
            <BodyText size="sm">{agreement.voided_at}</BodyText>
            {agreement.void_reason && (
              <BodyText size="sm" className="mt-1 text-red-600">
                Reason: {agreement.void_reason}
              </BodyText>
            )}
          </Box>
        )}
      </Box>

      {/* Description */}
      {agreement.description && (
        <Box>
          <BodyText size="xs" muted className="mb-1">
            Description
          </BodyText>
          <BodyText size="sm">{agreement.description}</BodyText>
        </Box>
      )}

      {/* Actions */}
      <Box className="border-border flex flex-row items-center gap-2 border-t pt-4">
        {userCanSend && (
          <Button variant="primary" size="md" onClick={onSend} disabled={isSendingAgreement}>
            {isSendingAgreement ? "Sending..." : "Send for Signature"}
          </Button>
        )}
        {userCanVoid && !showVoidConfirm && (
          <Button variant="danger" size="md" onClick={onVoidClick}>
            Void Agreement
          </Button>
        )}
      </Box>

      {/* Void Confirmation */}
      {showVoidConfirm && (
        <VoidConfirmation
          voidReason={voidReason}
          isVoiding={isVoidingAgreement}
          onReasonChange={onVoidReasonChange}
          onConfirm={onVoidConfirm}
          onCancel={onVoidCancel}
        />
      )}
    </Box>
  );
}
