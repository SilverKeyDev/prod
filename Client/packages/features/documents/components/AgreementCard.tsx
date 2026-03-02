import { useMemo } from "react";

import { FileText, Users } from "lucide-react";

import { BodyText, Button, Title } from "packages/ui/components/index.web";

import type { Agreement } from "@/features/documents/types/docusign";
import {
  calculateSigningProgress,
  formatAgreementDate,
  getAgreementTypeLabel,
} from "@/features/documents/utils/docusignHelpers";

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
    [agreement.participants]
  );

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleActionClick = (action: "view" | "send" | "sign" | "void", e: React.MouseEvent) => {
    e.stopPropagation();
    if (onActionClick) {
      onActionClick(action);
    }
  };

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`rounded-lg border border-gray-200 bg-white transition-colors hover:border-gray-300 ${
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
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <div className="mt-1 flex-shrink-0">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <div className="min-w-0 flex-1">
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
          <BodyText size="sm" className="mb-2 text-gray-700">
            {agreement.property_address}
          </BodyText>
        )}

        {/* Metadata */}
        <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
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
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Users className="h-3.5 w-3.5" />
                <BodyText as="span" size="xs" className="text-gray-600">
                  {signingProgress.signed}/{signingProgress.total} signed
                </BodyText>
              </div>
              <BodyText as="span" size="xs" className="text-gray-500">
                {signingProgress.percentage}%
              </BodyText>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${signingProgress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
            {agreement.status === "draft" && (
              <Button variant="primary" size="sm" onClick={(e) => handleActionClick("send", e)}>
                Send
              </Button>
            )}
            {(agreement.status === "sent" || agreement.status === "delivered") && (
              <Button variant="primary" size="sm" onClick={(e) => handleActionClick("sign", e)}>
                Sign
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={(e) => handleActionClick("view", e)}>
              View Details
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
