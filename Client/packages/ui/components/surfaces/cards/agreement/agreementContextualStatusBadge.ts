import type { ContextualAgreementStatus } from "./types";

export const AGREEMENT_CONTEXTUAL_STATUS_BADGE: Record<
  ContextualAgreementStatus,
  { label: string; className: string }
> = {
  sign_now: {
    label: "Sign Now",
    className: "border-gold/70 bg-gold-muted text-olive",
  },
  waiting_for_signature: {
    label: "Waiting for Signature",
    className: "border-gray-300 bg-gray-100 text-gray-600",
  },
  waiting_for_review: {
    label: "Waiting for Review",
    className: "border-gray-300 bg-gray-100 text-gray-600",
  },
  draft: {
    label: "Draft",
    className: "border-gray-300 bg-gray-100 text-gray-600",
  },
  sent: {
    label: "Sent",
    className: "border-gray-300 bg-gray-100 text-gray-600",
  },
  delivered: {
    label: "Delivered",
    className: "border-gray-300 bg-gray-100 text-gray-600",
  },
  signed: {
    label: "Signed",
    className: "border-olive/30 bg-olive-muted text-olive",
  },
  completed: {
    label: "Completed",
    className: "border-olive/30 bg-olive-muted text-olive",
  },
  voided: {
    label: "Voided",
    className: "border-red-300 bg-red-100 text-red-800",
  },
  declined: {
    label: "Declined",
    className: "border-red-300 bg-red-100 text-red-800",
  },
};
