import { Eye, FileText, Send, XCircle } from "lucide-react";

import { useAuthStore } from "packages/store";
import { BodyText, IconButton, Title } from "packages/ui/components/index.web";

import type { Agreement } from "@/features/documents/types/docusign";
import {
  calculateSigningProgress,
  canUserSend,
  canUserVoid,
  formatAgreementDate,
  getAgreementTypeLabel,
} from "@/features/documents/utils/docusignHelpers";

import AgreementStatusBadge from "./AgreementStatusBadge";

type AgreementListItemProps = {
  agreement: Agreement;
  onClick: () => void;
  onSend?: (agreementId: string) => void;
  onVoid?: (agreementId: string) => void;
};

/**
 * AgreementListItem Component
 *
 * Single agreement row in SavedPage documents list
 * Shows title, type, status, progress, and quick actions
 */
export default function AgreementListItem({
  agreement,
  onClick,
  onSend,
  onVoid,
}: AgreementListItemProps) {
  const user = useAuthStore((s) => s.user);
  const isAgent = user?.user_type === "agent";

  const signingProgress = calculateSigningProgress(agreement.participants);
  const canSend = canUserSend(agreement, user?.id ?? "", isAgent);
  const canVoid = canUserVoid(agreement, user?.id ?? "", isAgent);

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="group cursor-pointer rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300 hover:bg-gray-50"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-1 flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-1 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Title as="h3" size="md" className="truncate font-medium text-gray-900">
                {agreement.title}
              </Title>
              <BodyText size="sm" muted>
                {getAgreementTypeLabel(agreement.agreement_type)}
              </BodyText>
            </div>
            <AgreementStatusBadge status={agreement.status} size="sm" />
          </div>

          {/* Property Address */}
          {agreement.property_address && (
            <BodyText size="sm" className="mb-2 text-gray-700">
              📍 {agreement.property_address}
            </BodyText>
          )}

          {/* Metadata Row */}
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <BodyText as="span" size="xs" className="text-gray-500">
              Created {formatAgreementDate(agreement.created_at)}
            </BodyText>
            {agreement.sent_at && (
              <BodyText as="span" size="xs" className="text-gray-500">
                Sent {formatAgreementDate(agreement.sent_at)}
              </BodyText>
            )}
            {agreement.completed_at && (
              <BodyText as="span" size="xs" className="text-gray-500">
                Completed {formatAgreementDate(agreement.completed_at)}
              </BodyText>
            )}
          </div>

          {/* Progress (if applicable) */}
          {agreement.participants && agreement.participants.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${signingProgress.percentage}%` }}
                />
              </div>
              <BodyText as="span" size="xs" className="whitespace-nowrap text-gray-600">
                {signingProgress.signed}/{signingProgress.total} signed
              </BodyText>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <IconButton
            variant="ghost"
            size="sm"
            onClick={(e) => handleActionClick(e, onClick)}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </IconButton>
          {canSend && onSend && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={(e) => handleActionClick(e, () => onSend(agreement.id))}
              title="Send for Signature"
            >
              <Send className="h-4 w-4" />
            </IconButton>
          )}
          {canVoid && onVoid && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={(e) => handleActionClick(e, () => onVoid(agreement.id))}
              title="Void Agreement"
            >
              <XCircle className="h-4 w-4" />
            </IconButton>
          )}
        </div>
      </div>
    </div>
  );
}
