import { useMemo } from "react";

import { FileText, Users } from "lucide-react";

import type { Agreement } from "packages/schemas/content/documents/docusign";
import {
  calculateSigningProgress,
  formatAgreementDate,
  getAgreementTypeLabel,
} from "packages/utils/domain/documents/docusignHelpers";

import { BodyText, Button, Title } from "@/components/ui/index.web";

import AgreementStatusBadge from "./AgreementStatusBadge";

type AgreementCardProps = {
  agreement: Agreement;
  onClick?: () => void;
  onActionClick?: (action: "view" | "send" | "sign" | "void") => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
};

/**
 * AgreementCard Component
 *
 * Reusable card for displaying agreement summary
 * Used in dashboard widgets, messaging, and list views
 */
export default function AgreementCard({
  agreement,
  onClick,
  onActionClick,
  showActions = false,
  compact = false,
  className = "",
}: AgreementCardProps) {
  const signingProgress = useMemo(
    () => calculateSigningProgress(agreement.participants),
    [agreement.participants],
  );

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleActionClick = (
    action: "view" | "send" | "sign" | "void",
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (onActionClick) {
      onActionClick(action);
    }
  };

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      onClick={handleCardClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick();
              }
            }
          : undefined
      }
    >
      <div className={`${compact ? "p-3" : "p-4"}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="flex-shrink-0 mt-1">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <Title size="sm" className="truncate">
                {agreement.title}
              </Title>
              <BodyText size="xs" muted className="mt-0.5">
                {getAgreementTypeLabel(agreement.agreement_type)}
              </BodyText>
            </div>
          </div>
          <AgreementStatusBadge status={agreement.status} size="sm" />
        </div>

        {/* Property Address */}
        {agreement.property_address && (
          <BodyText size="sm" className="text-gray-700 mb-2">
            {agreement.property_address}
          </BodyText>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <BodyText as="span" size="xs" className="text-gray-500">
            Created {formatAgreementDate(agreement.created_at)}
          </BodyText>
          {agreement.sent_at && (
            <BodyText as="span" size="xs" className="text-gray-500">
              Sent {formatAgreementDate(agreement.sent_at)}
            </BodyText>
          )}
        </div>

        {/* Progress Bar (if sent) */}
        {agreement.participants && agreement.participants.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Users className="w-3.5 h-3.5" />
                <BodyText as="span" size="xs" className="text-gray-600">
                  {signingProgress.signed}/{signingProgress.total} signed
                </BodyText>
              </div>
              <BodyText as="span" size="xs" className="text-gray-500">
                {signingProgress.percentage}%
              </BodyText>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${signingProgress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            {agreement.status === "draft" && (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => handleActionClick("send", e)}
              >
                Send
              </Button>
            )}
            {(agreement.status === "sent" ||
              agreement.status === "delivered") && (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => handleActionClick("sign", e)}
              >
                Sign
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleActionClick("view", e)}
            >
              View Details
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
