import { Icon } from "@ui/icons";

import { useAuthStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";

import { BodyText, IconButton, Title } from "@/components/ui";
import type { Agreement } from "@/features/documents/types/agreements";
import {
  calculateSigningProgress,
  canUserSend,
  canUserVoid,
  formatAgreementDate,
  getAgreementTypeLabel,
} from "@/features/documents/utils/agreements";

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
    <Box
      role="button"
      tabIndex={0}
      className="group cursor-pointer rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:bg-gray-50 active:border-gray-300 active:border-gray-400 active:bg-gray-100 active:bg-gray-50"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <Box className="flex flex-row items-start gap-3">
        {/* Icon */}
        <Box className="mt-1 flex-shrink-0">
          <Box className="flex h-10 w-10 flex-row items-center justify-center rounded-lg bg-blue-50">
            <Icon name="file-text" className="h-5 w-5 text-blue-600" />
          </Box>
        </Box>

        {/* Content */}
        <Box className="min-w-0 flex-1">
          {/* Header */}
          <Box className="mb-1 flex flex-row items-start justify-between gap-3">
            <Box className="min-w-0 flex-1">
              <Title as="h3" size="md" className="truncate font-medium text-gray-900">
                {agreement.title}
              </Title>
              <BodyText size="sm" muted>
                {getAgreementTypeLabel(agreement.agreement_type)}
              </BodyText>
            </Box>
            <AgreementStatusBadge status={agreement.status} size="sm" />
          </Box>

          {/* Property Address */}
          {agreement.property_address && (
            <BodyText size="sm" className="mb-2 text-gray-700">
              📍 {agreement.property_address}
            </BodyText>
          )}

          {/* Metadata Row */}
          <Box className="mb-2 flex flex-row flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
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
          </Box>

          {/* Progress (if applicable) */}
          {agreement.participants && agreement.participants.length > 0 && (
            <Box className="flex flex-row items-center gap-2">
              <Box className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                <Box
                  className="h-full bg-green-500"
                  style={{ width: `${signingProgress.percentage}%` }}
                />
              </Box>
              <BodyText as="span" size="xs" className="whitespace-nowrap text-gray-600">
                {signingProgress.signed}/{signingProgress.total} signed
              </BodyText>
            </Box>
          )}
        </Box>

        {/* Actions */}
        <Box className="flex flex-shrink-0 flex-row items-center gap-1 opacity-0 group-hover:opacity-100 group-active:opacity-75">
          <IconButton
            variant="ghost"
            size="sm"
            onClick={(e) => handleActionClick(e, onClick)}
            title="View Details"
          >
            <Icon name="eye" className="h-4 w-4" />
          </IconButton>
          {canSend && onSend && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={(e) => handleActionClick(e, () => onSend(agreement.id))}
              title="Send for Signature"
            >
              <Icon name="send" className="h-4 w-4" />
            </IconButton>
          )}
          {canVoid && onVoid && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={(e) => handleActionClick(e, () => onVoid(agreement.id))}
              title="Void Agreement"
            >
              <Icon name="x-circle" className="h-4 w-4" />
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );
}
