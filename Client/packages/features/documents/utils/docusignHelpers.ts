import type {
  Agreement,
  AgreementParticipant,
  AgreementStatus,
  AgreementType,
  ParticipantRole,
} from "packages/features/documents/types/docusign";
import type { ContextualAgreementStatus } from "packages/utils/agreement/contextualAgreementStatus";
import {
  getContextualAgreementStatus,
  getNextSignerUserId,
} from "packages/utils/agreement/contextualAgreementStatus";
import { dateNow, dateParseISO } from "packages/utils/date";

/**
 * DocuSign Helper Functions
 * Utility functions for DocuSign UI components
 */

export type { ContextualAgreementStatus };
export type { AgreementLikeForContext } from "packages/utils/agreement/contextualAgreementStatus";
export { getContextualAgreementStatus, getNextSignerUserId };

/**
 * Get human-readable label for agreement type
 */
export function getAgreementTypeLabel(type: AgreementType): string {
  const labels: Record<AgreementType, string> = {
    buyer_representation: "Buyer Representation",
    offer: "Purchase Offer",
    inspection_addendum: "Inspection Addendum",
    financing_contingency: "Financing Contingency",
    closing_disclosure: "Closing Disclosure",
    other: "Other Agreement",
  };
  return labels[type];
}

/**
 * Get color class for agreement status badge.
 * Supports both raw DocuSign statuses and contextual statuses.
 */
export function getStatusColor(status: AgreementStatus | ContextualAgreementStatus): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700 border-gray-300",
    sent: "bg-blue-100 text-blue-700 border-blue-300",
    delivered: "bg-cyan-100 text-cyan-700 border-cyan-300",
    signed: "bg-purple-100 text-purple-700 border-purple-300",
    completed: "border-green-300 bg-green-100 text-green-800",
    voided: "border-red-300 bg-red-100 text-red-800",
    declined: "border-red-300 bg-red-100 text-red-800",
    sign_now: "border-yellow-400 bg-yellow-100 text-yellow-900",
    waiting_for_signature: "border-brown/40 bg-brown/10 text-brown",
    waiting_for_review: "border-brown/35 bg-brown/5 text-brown",
  };
  return colors[status] ?? colors.draft;
}

/**
 * Get human-readable status label.
 * Supports both raw DocuSign statuses and contextual statuses.
 */
export function getStatusLabel(status: AgreementStatus | ContextualAgreementStatus): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    sent: "Sent",
    delivered: "Delivered",
    signed: "Signed",
    completed: "Completed",
    voided: "Voided",
    declined: "Declined",
    sign_now: "Sign Now",
    waiting_for_signature: "Waiting for Signature",
    waiting_for_review: "Waiting for Review",
  };
  return labels[status] ?? status;
}

/**
 * Get tooltip description for status
 */
export function getStatusTooltip(status: AgreementStatus): string {
  const tooltips: Record<AgreementStatus, string> = {
    draft: "Agreement is being prepared",
    sent: "Agreement sent to recipients",
    delivered: "Agreement delivered to recipients",
    signed: "Partially signed by participants",
    completed: "All parties have signed",
    voided: "Agreement has been voided",
    declined: "Agreement was declined",
  };
  return tooltips[status];
}

/**
 * Check if user can sign the agreement
 */
export function canUserSign(agreement: Agreement, userId: string): boolean {
  if (!agreement.participants) return false;

  const userParticipant = agreement.participants.find((p) => p.user_id === userId);

  if (!userParticipant) return false;

  // Can sign if status is sent/delivered and user hasn't signed yet
  return (
    (agreement.status === "sent" || agreement.status === "delivered") &&
    (userParticipant.status === "pending" || userParticipant.status === "sent")
  );
}

/**
 * Check if user can send the agreement
 */
export function canUserSend(agreement: Agreement, userId: string, isAgent: boolean): boolean {
  // Only agents can send
  if (!isAgent) return false;

  // Agreement must be in draft status
  if (agreement.status !== "draft") return false;

  // User must be the agent who created it
  return agreement.agent_id === userId;
}

/**
 * Check if user can void the agreement
 */
export function canUserVoid(agreement: Agreement, userId: string, isAgent: boolean): boolean {
  // Only agents can void
  if (!isAgent) return false;

  // Can only void if sent, delivered, or signed (not completed)
  if (
    agreement.status !== "sent" &&
    agreement.status !== "delivered" &&
    agreement.status !== "signed"
  ) {
    return false;
  }

  // User must be the agent who created it
  return agreement.agent_id === userId;
}

/**
 * Check if user can create revisions
 */
export function canUserCreateRevision(
  agreement: Agreement,
  userId: string,
  isAgent: boolean
): boolean {
  // Only agents can create revisions
  if (!isAgent) return false;

  // Can only create revisions for drafts
  if (agreement.status !== "draft") return false;

  // User must be the agent who created it
  return agreement.agent_id === userId;
}

/**
 * Format participant role for display
 */
export function formatParticipantRole(role: ParticipantRole | string): string {
  const labels: Record<string, string> = {
    agent: "Agent",
    buyer: "Buyer",
    seller: "Seller",
    other: "Other",
    signer: "Signer",
    carbon_copy: "Carbon copy",
  };
  return labels[role] ?? role;
}

/**
 * Calculate signing progress (percentage)
 */
export function calculateSigningProgress(participants?: AgreementParticipant[]): {
  signed: number;
  total: number;
  percentage: number;
} {
  if (!participants || participants.length === 0) {
    return { signed: 0, total: 0, percentage: 0 };
  }

  const total = participants.length;
  const signed = participants.filter((p) => {
    const st = p.recipient_status ?? p.status;
    return st === "signed" || st === "completed";
  }).length;
  const percentage = Math.round((signed / total) * 100);

  return { signed, total, percentage };
}

/**
 * Get participant status color
 */
export function getParticipantStatusColor(
  status: AgreementParticipant["status"] | string | undefined
): string {
  const colors: Record<string, string> = {
    pending: "text-gray-500",
    sent: "text-blue-500",
    delivered: "text-cyan-500",
    signed: "text-green-500",
    completed: "text-green-600",
    declined: "text-red-500",
  };
  const key = status ?? "pending";
  return colors[key] ?? "text-gray-500";
}

/**
 * Format date for display
 */
export function formatAgreementDate(dateString?: string): string {
  if (!dateString) return "N/A";

  const date = dateParseISO(dateString).toDate();
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format date with time for display
 */
export function formatAgreementDateTime(dateString?: string): string {
  if (!dateString) return "N/A";

  const date = dateParseISO(dateString).toDate();
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Calculate days since agreement was sent
 */
export function daysSinceSent(sentAt?: string): number {
  if (!sentAt) return 0;

  const sent = dateParseISO(sentAt);
  const now = dateNow();
  const diffTime = Math.abs(now.valueOf() - sent.valueOf());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get urgency level based on days waiting
 */
export function getUrgencyLevel(daysWaiting: number): "low" | "medium" | "high" {
  if (daysWaiting >= 7) return "high";
  if (daysWaiting >= 3) return "medium";
  return "low";
}

/**
 * Get urgency color
 */
export function getUrgencyColor(urgency: "low" | "medium" | "high"): string {
  const colors = {
    low: "text-text-secondary",
    medium: "text-text-primary",
    high: "text-destructive",
  };
  return colors[urgency];
}
