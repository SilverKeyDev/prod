import { Icon } from "@ui/icons";

import { Box } from "packages/ui/components/primitives";

import { BodyText, Subtitle } from "@/components/ui";

import { AGREEMENT_CONTEXTUAL_STATUS_BADGE } from "./agreementContextualStatusBadge";
import type { ContextualAgreementStatus } from "./types";

interface AgreementCardHeaderProps {
  title: string;
  contextualStatus: ContextualAgreementStatus;
  signedCount: number;
  totalSigners: number;
  uploadedDate: string;
  /** Primary signer / recipient label (e.g. when agent sent to a client). */
  sentToLabel?: string | null;
}

export default function AgreementCardHeader({
  title,
  contextualStatus,
  signedCount,
  totalSigners,
  uploadedDate,
  sentToLabel,
}: AgreementCardHeaderProps) {
  const badge =
    AGREEMENT_CONTEXTUAL_STATUS_BADGE[contextualStatus] ?? AGREEMENT_CONTEXTUAL_STATUS_BADGE.draft;

  return (
    <>
      {/* Status badge (prominent, full-width row) */}
      <Box className="mb-2">
        <BodyText
          size="xs"
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold ${badge.className}`}
        >
          <Icon name="file-signature" size={12} className="shrink-0" />
          {badge.label}
        </BodyText>
      </Box>

      {/* Title row */}
      <Box className="mb-2 flex flex-row items-start gap-3">
        <Box className="text-foreground flex-shrink-0">
          <Icon name="file-signature" size={24} />
        </Box>
        <Box className="h-[2.75rem] min-w-0 flex-1 overflow-hidden">
          <Subtitle size="sm" className="line-clamp-2">
            {title}
          </Subtitle>
        </Box>
      </Box>

      {/* Progress indicator */}
      {totalSigners > 0 && (
        <Box className="mb-2 min-h-5">
          <BodyText size="xs" className="font-medium text-gray-600">
            {signedCount} of {totalSigners} signed
          </BodyText>
        </Box>
      )}

      {sentToLabel ? (
        <Box className="mb-2 min-h-5">
          <BodyText size="xs" muted>
            Sent to: {sentToLabel}
          </BodyText>
        </Box>
      ) : null}

      {/* Date */}
      <Box className="mb-4 flex flex-row items-center gap-2">
        <Icon name="calendar" size={14} className="flex-shrink-0 text-gray-400" />
        <BodyText size="xs" muted>
          {uploadedDate}
        </BodyText>
      </Box>
    </>
  );
}
