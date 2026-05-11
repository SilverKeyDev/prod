import { useMemo, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, ExternalLink, FileSignature } from "lucide-react";

import { queryKeys } from "packages/config/query/keys";
import { useLocalization } from "packages/contexts";
import { docusignApi } from "packages/features/documents/api/docusign";
import { AgreementDetailModal } from "packages/features/documents/components/agreement/AgreementDetailModal";
import { AgreementStatusBadge } from "packages/features/documents/components/agreement/AgreementStatusBadge";
import { CreateAgreementModal } from "packages/features/documents/components/agreement/CreateAgreementModal";
import { DocusignTemplateWizardModal } from "packages/features/documents/components/docusign/DocusignTemplateWizardModal";
import { DocusignUseTemplateModal } from "packages/features/documents/components/docusign/DocusignUseTemplateModal";
import { DocuSignWidgetSavedTemplatesSection } from "packages/features/documents/components/docusign/DocuSignWidgetSavedTemplatesSection";
import { useDocusignAgreements } from "packages/features/documents/hooks/data/docusign/useDocusignAgreements";
import { useDocusignTemplates } from "packages/features/documents/hooks/data/docusign/useDocusignTemplates";
import type { DocusignTemplate } from "packages/features/documents/types/docusign";
import { Button } from "packages/ui";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import { Icon } from "packages/ui/components/icons";
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

/** Cached template row from GET /docusign/templates (may include legacy `docusign_template_id`). */
type ListDocusignTemplate = DocusignTemplate & { docusign_template_id?: string };

/** Dashboard DocuSign agreements widget: templates, stats, pending and recent lists. */
export default function DocuSignWidget() {
  const { t } = useLocalization();
  const qc = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTemplateWizardOpen, setIsTemplateWizardOpen] = useState(false);
  const [useTemplateCtx, setUseTemplateCtx] = useState<{
    docusignTemplateId: string;
    name: string;
  } | null>(null);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);

  const { agreements, isLoading, error } = useDocusignAgreements();
  const { templates: savedTemplates } = useDocusignTemplates();

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => docusignApi.deleteTemplate(templateId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.docusign.templates() });
    },
  });

  const openEditorMutation = useMutation({
    mutationFn: (templateId: string) => docusignApi.getTemplateEditUrl(templateId),
    onSuccess: (res) => {
      if (res.success && res.edit_url) {
        const w = getWindow();
        if (w) w.open(res.edit_url, "_blank", "noopener,noreferrer");
      }
    },
  });

  // Filter for pending signatures (sent, delivered, or partially signed)
  // Sorted by urgency (days waiting, descending)
  const pendingSignatures = useMemo(() => {
    return agreements
      .filter((a) => a.status === "sent" || a.status === "delivered" || a.status === "signed")
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
          !dateParseISO(a.completed_at).isBefore(oneWeekAgo)
      ).length,
      voidedThisMonth: agreements.filter(
        (a) =>
          a.status === "voided" && a.voided_at && !dateParseISO(a.voided_at).isBefore(oneMonthAgo)
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
          <Box className="flex flex-shrink-0 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsTemplateWizardOpen(true)}
              iconName="file-text"
            >
              {t("docusign.widget_template", { defaultValue: "Template" })}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              iconName="plus"
            >
              {t("docusign.widget_create", { defaultValue: "Create" })}
            </Button>
          </Box>
        </Box>

        <DocuSignWidgetSavedTemplatesSection
          savedTemplates={savedTemplates as ListDocusignTemplate[]}
          onUseTemplate={(tid, name) => setUseTemplateCtx({ docusignTemplateId: tid, name })}
          onEditTemplate={(tid) => void openEditorMutation.mutateAsync(tid)}
          onDeleteTemplate={(tid) => void deleteTemplateMutation.mutateAsync(tid)}
          isEditPending={openEditorMutation.isPending}
          isDeletePending={deleteTemplateMutation.isPending}
        />

        {/* Summary Statistics - Three-card overview */}
        <Box className="mb-6 grid grid-cols-3 gap-3">
          {/* Pending signatures - requires action */}
          <Box className="border-border-card-subtle bg-accent-muted rounded-lg border p-3 text-center">
            <Box className="text-text-primary text-2xl font-bold">{stats.totalPending}</Box>
            <BodyText size="xs" muted>
              {t("docusign.widget_stat_pending", { defaultValue: "Pending" })}
            </BodyText>
          </Box>

          {/* Completed this week - success metric */}
          <Box className="border-border-card-subtle bg-primary-muted rounded-lg border p-3 text-center">
            <Box className="text-primary text-2xl font-bold">{stats.completedThisWeek}</Box>
            <BodyText size="xs" muted>
              {t("docusign.widget_stat_this_week", {
                defaultValue: "This Week",
              })}
            </BodyText>
          </Box>

          {/* Voided this month - tracking cancelled agreements */}
          <Box className="border-border-card-subtle bg-background-surface rounded-lg border p-3 text-center">
            <Box className="text-destructive text-2xl font-bold">{stats.voidedThisMonth}</Box>
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
              <Title as="h3" size="sm" className="text-text-primary font-medium">
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
                      className="border-border bg-background-surface hover:border-border-card-strong focus-visible:ring-primary w-full cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      onClick={() => setSelectedAgreementId(agreement.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedAgreementId(agreement.id);
                        }
                      }}
                    >
                      <Box className="flex flex-row items-stretch">
                        <Box className="bg-accent w-1.5" />
                        <Box className="flex flex-1 flex-row items-start gap-3 p-3 sm:p-4">
                          <Box className="border-border-card-subtle bg-accent-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border">
                            <Icon name="file-signature" size={18} className="text-primary" />
                          </Box>
                          <Box className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <Box className="flex items-start justify-between gap-2">
                              <BodyText
                                as="p"
                                size="sm"
                                className="text-text-primary font-semibold leading-snug"
                              >
                                {agreement.title}
                              </BodyText>
                              <AgreementStatusBadge
                                status={agreement.status}
                                size="sm"
                                showIcon={false}
                              />
                            </Box>
                            {agreement.buyer_name ? (
                              <BodyText as="p" size="xs" muted>
                                {agreement.buyer_name}
                              </BodyText>
                            ) : null}
                            <Box className="flex items-center gap-1">
                              <Clock className={`h-3 w-3 shrink-0 ${urgencyColor}`} />
                              <BodyText
                                as="span"
                                size="xs"
                                className={`leading-relaxed ${urgencyColor}`}
                              >
                                {daysWaiting} {daysWaiting === 1 ? "day" : "days"} waiting
                              </BodyText>
                            </Box>
                          </Box>
                        </Box>
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
              <Title as="h3" size="sm" className="text-text-primary font-medium">
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
                    className="border-border bg-background-surface hover:border-border-card-strong focus-visible:ring-primary w-full cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    onClick={() => setSelectedAgreementId(agreement.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedAgreementId(agreement.id);
                      }
                    }}
                  >
                    <Box className="flex flex-row items-stretch">
                      <Box className="bg-accent w-1.5" />
                      <Box className="flex flex-1 flex-row items-start gap-3 p-3 sm:p-4">
                        <Box className="border-border-card-subtle bg-accent-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border">
                          <Icon name="file-text" size={18} className="text-primary" />
                        </Box>
                        <Box className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <Box className="flex items-start justify-between gap-2">
                            <BodyText
                              as="p"
                              size="sm"
                              className="text-text-primary font-semibold leading-snug"
                            >
                              {agreement.title}
                            </BodyText>
                            <AgreementStatusBadge
                              status={agreement.status}
                              size="sm"
                              showIcon={false}
                            />
                          </Box>
                          {agreement.buyer_name ? (
                            <BodyText as="p" size="xs" muted>
                              {agreement.buyer_name}
                            </BodyText>
                          ) : null}
                          <BodyText as="p" size="xs" muted className="leading-relaxed">
                            {formatAgreementDate(agreement.updated_at || agreement.created_at)}
                          </BodyText>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* View All Link - navigates to Library documents view */}
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
                if (win) win.location.href = "/library?library=documents";
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
      <DocusignTemplateWizardModal
        isOpen={isTemplateWizardOpen}
        onClose={() => setIsTemplateWizardOpen(false)}
      />
      {useTemplateCtx ? (
        <DocusignUseTemplateModal
          isOpen
          onClose={() => setUseTemplateCtx(null)}
          docusignTemplateId={useTemplateCtx.docusignTemplateId}
          templateDisplayName={useTemplateCtx.name}
        />
      ) : null}
      <AgreementDetailModal
        agreementId={selectedAgreementId}
        isOpen={!!selectedAgreementId}
        onClose={() => setSelectedAgreementId(null)}
      />
    </>
  );
}
