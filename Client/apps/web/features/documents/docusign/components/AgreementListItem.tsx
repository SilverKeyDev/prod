import { FileText, Eye, Send, XCircle } from "lucide-react";
import AgreementStatusBadge from "./AgreementStatusBadge";
import {
  getAgreementTypeLabel,
  calculateSigningProgress,
  formatAgreementDate,
  canUserSend,
  canUserVoid,
} from "../../../../../../packages/utils/documents/docusignHelpers";
import { IconButton, BodyText } from "../../../../components/ui";
import { useAuthStore } from "../../../../../../packages/store/auth.slice";
import type { Agreement } from "../../../../../../packages/schemas/documents/docusign";

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

  const handleActionClick = (
    e: React.MouseEvent,
    action: () => void
  ) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      className="group border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium text-gray-900 truncate">
                {agreement.title}
              </h3>
              <BodyText size="sm" muted>
                {getAgreementTypeLabel(agreement.agreement_type)}
              </BodyText>
            </div>
            <AgreementStatusBadge status={agreement.status} size="sm" />
          </div>

          {/* Property Address */}
          {agreement.property_address && (
            <BodyText size="sm" className="text-gray-700 mb-2">
              📍 {agreement.property_address}
            </BodyText>
          )}

          {/* Metadata Row */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
            <span>Created {formatAgreementDate(agreement.created_at)}</span>
            {agreement.sent_at && (
              <span>Sent {formatAgreementDate(agreement.sent_at)}</span>
            )}
            {agreement.completed_at && (
              <span>Completed {formatAgreementDate(agreement.completed_at)}</span>
            )}
          </div>

          {/* Progress (if applicable) */}
          {agreement.participants && agreement.participants.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${signingProgress.percentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 whitespace-nowrap">
                {signingProgress.signed}/{signingProgress.total} signed
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconButton
            variant="ghost"
            size="sm"
            onClick={(e) => handleActionClick(e, onClick)}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </IconButton>
          {canSend && onSend && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={(e) => handleActionClick(e, () => onSend(agreement.id))}
              title="Send for Signature"
            >
              <Send className="w-4 h-4" />
            </IconButton>
          )}
          {canVoid && onVoid && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={(e) => handleActionClick(e, () => onVoid(agreement.id))}
              title="Void Agreement"
            >
              <XCircle className="w-4 h-4" />
            </IconButton>
          )}
        </div>
      </div>
    </div>
  );
}
