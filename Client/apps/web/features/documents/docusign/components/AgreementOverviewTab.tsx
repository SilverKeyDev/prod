import type { Agreement } from "packages/schemas/content/documents/docusign";
import {
  formatAgreementDate,
  getAgreementTypeLabel,
} from "packages/utils/domain/documents/docusignHelpers";

import { BodyText, Button } from "@/components/ui/index.web";

import AgreementStatusBadge from "./AgreementStatusBadge";
import VoidConfirmation from "./VoidConfirmation";

type AgreementOverviewTabProps = {
  agreement: Agreement;
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
            {getAgreementTypeLabel(agreement.agreement_type)}
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
          <BodyText size="sm">
            {formatAgreementDate(agreement.created_at)}
          </BodyText>
        </div>
        {agreement.sent_at && (
          <div>
            <BodyText size="xs" muted className="mb-1">
              Sent
            </BodyText>
            <BodyText size="sm">
              {formatAgreementDate(agreement.sent_at)}
            </BodyText>
          </div>
        )}
        {agreement.completed_at && (
          <div>
            <BodyText size="xs" muted className="mb-1">
              Completed
            </BodyText>
            <BodyText size="sm">
              {formatAgreementDate(agreement.completed_at)}
            </BodyText>
          </div>
        )}
        {agreement.voided_at && (
          <div className="col-span-2">
            <BodyText size="xs" muted className="mb-1">
              Voided
            </BodyText>
            <BodyText size="sm">
              {formatAgreementDate(agreement.voided_at)}
            </BodyText>
            {agreement.void_reason && (
              <BodyText size="sm" className="text-red-600 mt-1">
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
      <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
        {userCanSend && (
          <Button
            variant="primary"
            size="md"
            onClick={onSend}
            disabled={isSendingAgreement}
          >
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
