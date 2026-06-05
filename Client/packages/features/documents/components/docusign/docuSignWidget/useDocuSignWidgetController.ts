import { useMemo, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { docusignApi } from "packages/features/documents/api/docusign";
import { useDocusignAgreements } from "packages/features/documents/hooks/data/docusign/useDocusignAgreements";
import { useDocusignTemplates } from "packages/features/documents/hooks/data/docusign/useDocusignTemplates";
import type { DocusignTemplate } from "packages/features/documents/types/docusign";
import { getWindow } from "packages/utils/core/platform";

import {
  buildDocuSignWidgetStats,
  selectPendingSignaturesForWidget,
  selectRecentAgreementsForWidget,
} from "./docuSignWidgetModel";

export type ListDocusignTemplate = DocusignTemplate;

export function useDocuSignWidgetController() {
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

  const pendingSignatures = useMemo(
    () => selectPendingSignaturesForWidget(agreements),
    [agreements]
  );

  const recentAgreements = useMemo(() => selectRecentAgreementsForWidget(agreements), [agreements]);

  const stats = useMemo(
    () => buildDocuSignWidgetStats(agreements, pendingSignatures),
    [agreements, pendingSignatures]
  );

  return {
    agreements,
    isLoading,
    error,
    savedTemplates,
    pendingSignatures,
    recentAgreements,
    stats,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isTemplateWizardOpen,
    setIsTemplateWizardOpen,
    useTemplateCtx,
    setUseTemplateCtx,
    selectedAgreementId,
    setSelectedAgreementId,
    deleteTemplateMutation,
    openEditorMutation,
  };
}
