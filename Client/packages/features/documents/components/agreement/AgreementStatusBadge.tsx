import { FileSignature, FileText } from "lucide-react";

import type { AgreementStatus } from "packages/features/documents/types/docusign";
import type { ContextualAgreementStatus } from "packages/features/documents/utils/docusignHelpers";
import { getStatusColor, getStatusLabel } from "packages/features/documents/utils/docusignHelpers";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText } from "@/components/ui";

const KNOWN_STATUSES: readonly string[] = [
  "draft",
  "sent",
  "delivered",
  "signed",
  "completed",
  "voided",
  "declined",
  "sign_now",
  "waiting_for_signature",
  "waiting_for_review",
];

function normalizeStatus(status: string): AgreementStatus | ContextualAgreementStatus | null {
  return KNOWN_STATUSES.includes(status)
    ? (status as AgreementStatus | ContextualAgreementStatus)
    : null;
}

const CONTEXTUAL_STATUSES = new Set<string>([
  "sign_now",
  "waiting_for_signature",
  "waiting_for_review",
]);

export type AgreementStatusBadgeProps = {
  status: AgreementStatus | ContextualAgreementStatus | string;
  size?: "xs" | "sm" | "md";
  showIcon?: boolean;
};

const SIZE_CLASSES: Record<NonNullable<AgreementStatusBadgeProps["size"]>, string> = {
  xs: "px-1.5 py-0",
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
};

const BODY_SIZE: Record<NonNullable<AgreementStatusBadgeProps["size"]>, "xs" | "sm"> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
};

export function AgreementStatusBadge({
  status,
  size = "sm",
  showIcon = true,
}: AgreementStatusBadgeProps) {
  const raw = String(status);
  const normalized = normalizeStatus(raw);
  const colorClasses = normalized
    ? getStatusColor(normalized)
    : "bg-gray-100 text-gray-700 border-gray-300";
  const label = normalized ? getStatusLabel(normalized) : raw;
  const sizeClass = SIZE_CLASSES[size];
  const bodySize = BODY_SIZE[size];

  const useSignatureIcon = normalized && CONTEXTUAL_STATUSES.has(normalized);
  const IconComponent = useSignatureIcon ? FileSignature : FileText;

  return (
    <Box
      className={`inline-flex max-w-full items-center gap-1 rounded-full border font-medium ${colorClasses} ${sizeClass}`}
    >
      {showIcon ? <IconComponent className="h-3 w-3 shrink-0 opacity-80" aria-hidden /> : null}
      <BodyText as="span" size={bodySize} className="truncate font-medium">
        {label}
      </BodyText>
    </Box>
  );
}
