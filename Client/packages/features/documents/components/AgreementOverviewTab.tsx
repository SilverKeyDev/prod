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
    <div className="space-y-6">
      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <BodyText size="xs" muted className="mb-1">
            Agreement Type
          </BodyText>
          <BodyText size="sm">
            {agreement.agreement_type.charAt(0).toUpperCase() +
              agreement.agreement_type.slice(1).replace(/_/g, " ")}
          </BodyText>
        </div>
        <div>
          <BodyText size="xs" muted className="mb-1">
            Status
          </BodyText>
          <AgreementStatusBadge status={agreement.status} size="sm" />
        </div>
        {agreement.property_address && (
          <div className="col-span-2">
            <BodyText size="xs" muted className="mb-1">
              Property Address
            </BodyText>
            <BodyText size="sm">{agreement.property_address}</BodyText>
          </div>
        )}
        <div>
          <BodyText size="xs" muted className="mb-1">
            Created
          </BodyText>
          <BodyText size="sm">{agreement.created_at}</BodyText>
        </div>
        {agreement.sent_at && (
          <div>
            <BodyText size="xs" muted className="mb-1">
              Sent
            </BodyText>
            <BodyText size="sm">{agreement.sent_at}</BodyText>
          </div>
        )}
        {agreement.completed_at && (
          <div>
            <BodyText size="xs" muted className="mb-1">
              Completed
            </BodyText>
            <BodyText size="sm">{agreement.completed_at}</BodyText>
          </div>
        )}
        {agreement.voided_at && (
          <div className="col-span-2">
            <BodyText size="xs" muted className="mb-1">
              Voided
            </BodyText>
            <BodyText size="sm">{agreement.voided_at}</BodyText>
            {agreement.void_reason && (
              <BodyText size="sm" className="mt-1 text-red-600">
                Reason: {agreement.void_reason}
              </BodyText>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {agreement.description && (
        <div>
          <BodyText size="xs" muted className="mb-1">
            Description
          </BodyText>
          <BodyText size="sm">{agreement.description}</BodyText>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-gray-200 pt-4">
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
      </div>

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
    </div>
  );
}
