import { useMemo, useState } from "react";

import { Clock, ExternalLink, FileSignature, Plus } from "lucide-react";

import { useLocalization } from "packages/contexts";
import { useDocusignAgreements } from "packages/features/documents/hooks/data/useDocusignAgreements";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import Button from "packages/ui/components/button/Button";
import { Box } from "packages/ui/components/primitives";
import { dateNow, dateParseISO } from "packages/utils/date";
import { getWindow } from "packages/utils/platform";

import { BodyText, Title } from "@/components/ui";
import {
  daysSinceSent,
  formatAgreementDate,
  getUrgencyColor,
  getUrgencyLevel,
} from "@/features/documents/utils/docusignHelpers";

import { AgreementDetailModal } from "./AgreementDetailModal";
import { AgreementStatusBadge } from "./AgreementStatusBadge";
import { CreateAgreementModal } from "./CreateAgreementModal";

/**
 * DocuSignWidget Component
 *
 * Dashboard widget for managing DocuSign agreements. Displays:
 * - Summary statistics (pending, completed this week, voided this month)
 * - Pending signatures requiring attention (with urgency indicators)
 * - Recent agreements (last 5 by updated date)
 * - Quick actions (create new, view all)
 *
 * The widget uses a two-column layout on desktop (lg breakpoint):
 * - Left column: Pending signatures sorted by urgency
 * - Right column: Recent agreements sorted by date
 *
 * Clicking an agreement opens a detail modal with full information.
 *
 * @component
 *
 * @example
 * ```tsx
 * // Add to dashboard
 * import { DocuSignWidget } from 'packages/features/documents';
 *
 * function Dashboard() {
 *   return (
 *     <Box className="dashboard-grid">
 *       <DocuSignWidget />
 *       {/* other widgets *\/}
 *     </Box>
 *   );
 * }
 * ```
 */
export default function DocuSignWidget() {
  const { t } = useLocalization();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(
    null,
  );

  const { agreements, isLoading, error } = useDocusignAgreements();

  // Filter for pending signatures (sent, delivered, or partially signed)
  // Sorted by urgency (days waiting, descending)
  const pendingSignatures = useMemo(() => {
    return agreements
      .filter(
        (a) =>
          a.status === "sent" ||
          a.status === "delivered" ||
          a.status === "signed",
      )
      .sort((a, b) => {
        const daysA = daysSinceSent(a.sent_at);
        const daysB = daysSinceSent(b.sent_at);
        return daysB - daysA; // Most urgent first
      })
      .slice(0, 5); // Top 5 most urgent
  }, [agreements]);

  // Recent agreements (any status, sorted by updated date)
  const recentAgreements = useMemo(() => {
    return [...agreements]
      .sort((a, b) => {
        const dateA = dateParseISO(a.updated_at || a.created_at).valueOf();
        const dateB = dateParseISO(b.updated_at || b.created_at).valueOf();
        return dateB - dateA; // Most recent first
      })
      .slice(0, 5); // Top 5 most recent
  }, [agreements]);

  // Calculate summary statistics for overview cards
  const stats = useMemo(() => {
    const now = dateNow();
    const oneWeekAgo = now.subtract(7, "day");
    const oneMonthAgo = now.subtract(30, "day");

    return {
      totalPending: pendingSignatures.length,
      completedThisWeek: agreements.filter(
        (a) =>
          a.status === "completed" &&
          a.completed_at &&
          !dateParseISO(a.completed_at).isBefore(oneWeekAgo),
      ).length,
      voidedThisMonth: agreements.filter(
        (a) =>
          a.status === "voided" &&
          a.voided_at &&
          !dateParseISO(a.voided_at).isBefore(oneMonthAgo),
      ).length,
    };
  }, [agreements, pendingSignatures]);

  // Loading state
  if (isLoading) {
    return (
      <Box className="border-border bg-background-surface rounded-lg border p-6">
        <Box className="flex items-center justify-center py-8">
          <KeyTurnLoader
            message={t("docusign.widget_loading", {
              defaultValue: "Loading agreements...",
            })}
          />
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box className="border-border bg-background-surface rounded-lg border p-6">
        <Box className="py-8 text-center">
          <BodyText size="sm" className="text-destructive">
            {t("docusign.widget_error_load", {
              defaultValue: "Failed to load agreements",
            })}
          </BodyText>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Box className="border-border bg-background-surface rounded-lg border p-6">
        {/* Header with icon and create button */}
        <Box className="mb-4 flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <FileSignature className="text-primary h-5 w-5" />
            <Title size="md">
              {t("docusign.widget_title", {
                defaultValue: "DocuSign Agreements",
              })}
            </Title>
          </Box>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            {t("docusign.widget_create", { defaultValue: "Create" })}
          </Button>
        </Box>

        {/* Summary Statistics - Three-card overview */}
        <Box className="mb-6 grid grid-cols-3 gap-3">
          {/* Pending signatures - requires action */}
          <Box className="border-border-card-subtle rounded-lg border bg-yellow-50 p-3 text-center">
            <Box className="text-2xl font-bold text-yellow-800">
              {stats.totalPending}
            </Box>
            <BodyText size="xs" muted>
              {t("docusign.widget_stat_pending", { defaultValue: "Pending" })}
            </BodyText>
          </Box>

          {/* Completed this week - success metric */}
          <Box className="border-border-card-subtle bg-primary-muted rounded-lg border p-3 text-center">
            <Box className="text-primary text-2xl font-bold">
              {stats.completedThisWeek}
            </Box>
            <BodyText size="xs" muted>
              {t("docusign.widget_stat_this_week", {
                defaultValue: "This Week",
              })}
            </BodyText>
          </Box>

          {/* Voided this month - tracking cancelled agreements */}
          <Box className="border-border-card-subtle rounded-lg border bg-rose-50 p-3 text-center">
            <Box className="text-2xl font-bold text-rose-800">
              {stats.voidedThisMonth}
            </Box>
            <BodyText size="xs" muted>
              {t("docusign.widget_stat_voided", { defaultValue: "Voided" })}
            </BodyText>
          </Box>
        </Box>

        {/* Two-column layout: Pending signatures (left) and Recent agreements (right) */}
        <Box className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Column 1: Pending Signatures */}
          <Box>
            <Box className="mb-3 flex items-center justify-between">
              <Title
                as="h3"
                size="sm"
                className="text-text-primary font-medium"
              >
                {t("docusign.widget_section_pending", {
                  defaultValue: "Pending Signatures",
                })}
              </Title>
            </Box>
            {pendingSignatures.length === 0 ? (
              <Box className="border-border rounded-lg border border-dashed py-6 text-center">
                <BodyText size="sm" muted>
                  {t("docusign.widget_empty_pending", {
                    defaultValue: "No pending signatures",
                  })}
                </BodyText>
              </Box>
            ) : (
              <Box className="space-y-2">
                {pendingSignatures.map((agreement) => {
                  const daysWaiting = daysSinceSent(agreement.sent_at);
                  const urgency = getUrgencyLevel(daysWaiting);
                  const urgencyColor = getUrgencyColor(urgency);

                  return (
                    <Box
                      key={agreement.id}
                      role="button"
                      tabIndex={0}
                      className="border-border hover:bg-accent-muted cursor-pointer rounded-lg border p-3 transition-colors"
                      onClick={() => setSelectedAgreementId(agreement.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedAgreementId(agreement.id);
                        }
                      }}
                    >
                      <Box className="mb-1 flex items-start justify-between gap-2">
                        <BodyText
                          as="p"
                          size="sm"
                          className="text-text-primary flex-1 truncate font-medium"
                        >
                          {agreement.title}
                        </BodyText>
                        <AgreementStatusBadge
                          status={agreement.status}
                          size="sm"
                          showIcon={false}
                        />
                      </Box>
                      {agreement.buyer_name && (
                        <BodyText as="p" size="xs" muted className="mb-1">
                          {agreement.buyer_name}
                        </BodyText>
                      )}
                      {/* Urgency indicator - color changes based on days waiting */}
                      <Box className="flex items-center gap-1 text-xs">
                        <Clock className={`h-3 w-3 ${urgencyColor}`} />
                        <BodyText as="span" size="xs" className={urgencyColor}>
                          {daysWaiting} {daysWaiting === 1 ? "day" : "days"}{" "}
                          waiting
                        </BodyText>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>

          {/* Column 2: Recent Agreements */}
          <Box>
            <Box className="mb-3 flex items-center justify-between">
              <Title
                as="h3"
                size="sm"
                className="text-text-primary font-medium"
              >
                {t("docusign.widget_section_recent", {
                  defaultValue: "Recent Agreements",
                })}
              </Title>
            </Box>
            {recentAgreements.length === 0 ? (
              <Box className="border-border rounded-lg border border-dashed py-6 text-center">
                <BodyText size="sm" muted>
                  {t("docusign.widget_empty_recent", {
                    defaultValue: "No agreements yet",
                  })}
                </BodyText>
              </Box>
            ) : (
              <Box className="space-y-2">
                {recentAgreements.map((agreement) => (
                  <Box
                    key={agreement.id}
                    role="button"
                    tabIndex={0}
                    className="border-border hover:bg-accent-muted cursor-pointer rounded-lg border p-3 transition-colors"
                    onClick={() => setSelectedAgreementId(agreement.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedAgreementId(agreement.id);
                      }
                    }}
                  >
                    <Box className="mb-1 flex items-start justify-between gap-2">
                      <BodyText
                        as="p"
                        size="sm"
                        className="text-text-primary flex-1 truncate font-medium"
                      >
                        {agreement.title}
                      </BodyText>
                      <AgreementStatusBadge
                        status={agreement.status}
                        size="sm"
                        showIcon={false}
                      />
                    </Box>
                    {agreement.buyer_name && (
                      <BodyText as="p" size="xs" muted className="mb-1">
                        {agreement.buyer_name}
                      </BodyText>
                    )}
                    <BodyText as="p" size="xs" muted>
                      {formatAgreementDate(
                        agreement.updated_at || agreement.created_at,
                      )}
                    </BodyText>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* View All Link - navigates to SavedPage documents view */}
        {agreements.length > 0 && (
          <Box className="border-border mt-4 border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              contentAlign="start"
              icon={<ExternalLink className="h-3.5 w-3.5" />}
              iconPosition="right"
              onClick={() => {
                const win = getWindow();
                if (win) win.location.href = "/saved?view=documents";
              }}
              className="h-auto"
            >
              {t("docusign.widget_view_all", {
                defaultValue: "View All Agreements",
              })}
            </Button>
          </Box>
        )}
      </Box>

      {/* Modals - rendered conditionally based on state */}
      <CreateAgreementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <AgreementDetailModal
        agreementId={selectedAgreementId}
        isOpen={!!selectedAgreementId}
        onClose={() => setSelectedAgreementId(null)}
      />
    </>
  );
}
