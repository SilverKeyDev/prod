import type { ContextualAgreementStatus } from "packages/utils/transaction/agreement/contextualAgreementStatus";

/**
 * Vertical accent bar (w-1.5) for agenda-style agreement / DocuSign rows.
 * Gold: your turn to sign — light olive: finished — gray: waiting / not your turn — red: voided / declined.
 */
export function agreementAgendaAccentBarClass(status: ContextualAgreementStatus): string {
  switch (status) {
    case "sign_now":
      return "bg-gold";
    case "completed":
    case "signed":
      return "bg-olive-muted";
    case "waiting_for_signature":
    case "waiting_for_review":
    case "draft":
    case "sent":
    case "delivered":
      return "bg-gray-300";
    case "voided":
    case "declined":
      return "bg-red-500";
    default:
      return "bg-gray-300";
  }
}
