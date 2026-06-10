import type { Agreement } from "packages/features/documents/types/docusign";
import { dateNow, dateParseISO } from "packages/utils/core/date";

import { daysSinceSent } from "@/features/documents/utils/docusignHelpers";

export function selectPendingSignaturesForWidget(agreements: Agreement[]): Agreement[] {
  return agreements
    .filter((a) => a.status === "sent" || a.status === "delivered" || a.status === "signed")
    .sort((a, b) => {
      const daysA = daysSinceSent(a.sent_at);
      const daysB = daysSinceSent(b.sent_at);
      return daysB - daysA;
    })
    .slice(0, 5);
}

export function selectRecentAgreementsForWidget(agreements: Agreement[]): Agreement[] {
  return [...agreements]
    .sort((a, b) => {
      const dateA = dateParseISO(a.updated_at || a.created_at).valueOf();
      const dateB = dateParseISO(b.updated_at || b.created_at).valueOf();
      return dateB - dateA;
    })
    .slice(0, 5);
}

export type DocuSignWidgetStats = {
  totalPending: number;
  completedThisWeek: number;
  voidedThisMonth: number;
};

export function buildDocuSignWidgetStats(
  agreements: Agreement[],
  pendingForDisplay: Agreement[]
): DocuSignWidgetStats {
  const now = dateNow();
  const oneWeekAgo = now.subtract(7, "day");
  const oneMonthAgo = now.subtract(30, "day");

  return {
    totalPending: pendingForDisplay.length,
    completedThisWeek: agreements.filter(
      (a) =>
        a.status === "completed" &&
        a.completed_at &&
        !dateParseISO(a.completed_at).isBefore(oneWeekAgo)
    ).length,
    voidedThisMonth: agreements.filter(
      (a) =>
        a.status === "voided" && a.voided_at && !dateParseISO(a.voided_at).isBefore(oneMonthAgo)
    ).length,
  };
}
