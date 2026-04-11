import { Icon } from "@ui/icons";

import { Box } from "packages/ui/components/primitives";

import { BodyText, Subtitle } from "@/components/ui";

import type { ContextualAgreementStatus } from "./types";

interface AgreementCardHeaderProps {
  title: string;
  contextualStatus: ContextualAgreementStatus;
  signedCount: number;
  totalSigners: number;
  uploadedDate: string;
}

const STATUS_BADGE: Record<
  ContextualAgreementStatus,
  { label: string; className: string }
> = {
  sign_now: {
    label: "Sign Now",
    className: "bg-amber-100 text-amber-700 border-amber-300",
  },
  waiting_for_signature: {
    label: "Waiting for Signature",
    className: "bg-blue-100 text-blue-700 border-blue-300",
  },
  waiting_for_review: {
    label: "Waiting for Review",
    className: "bg-indigo-100 text-indigo-700 border-indigo-300",
  },
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-700 border-gray-300",
  },
  sent: {
    label: "Sent",
    className: "bg-blue-100 text-blue-700 border-blue-300",
  },
  delivered: {
    label: "Delivered",
    className: "bg-cyan-100 text-cyan-700 border-cyan-300",
  },
  signed: {
    label: "Signed",
    className: "bg-purple-100 text-purple-700 border-purple-300",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-700 border-green-300",
  },
  voided: {
    label: "Voided",
    className: "bg-red-100 text-red-700 border-red-300",
  },
  declined: {
    label: "Declined",
    className: "bg-orange-100 text-orange-700 border-orange-300",
  },
};

export default function AgreementCardHeader({
  title,
  contextualStatus,
  signedCount,
  totalSigners,
  uploadedDate,
}: AgreementCardHeaderProps) {
  const badge = STATUS_BADGE[contextualStatus] ?? STATUS_BADGE.draft;

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

      {/* Date */}
      <Box className="mb-4 flex flex-row items-center gap-2">
        <Icon
          name="calendar"
          size={14}
          className="flex-shrink-0 text-gray-400"
        />
        <BodyText size="xs" muted>
          {uploadedDate}
        </BodyText>
      </Box>
    </>
  );
}
