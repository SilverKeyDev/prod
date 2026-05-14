import { AgreementDetailModal } from "packages/features/documents/components/agreement/AgreementDetailModal";
import { CreateAgreementModal } from "packages/features/documents/components/agreement/CreateAgreementModal";
import { DocusignTemplateWizardModal } from "packages/features/documents/components/docusign/DocusignTemplateWizardModal";
import { DocusignUseTemplateModal } from "packages/features/documents/components/docusign/DocusignUseTemplateModal";
import { DocuSignWidgetFooter } from "packages/features/documents/components/docusign/docuSignWidget/DocuSignWidgetFooter";
import { DocuSignWidgetHeader } from "packages/features/documents/components/docusign/docuSignWidget/DocuSignWidgetHeader";
import {
  DocuSignWidgetError,
  DocuSignWidgetLoading,
} from "packages/features/documents/components/docusign/docuSignWidget/DocuSignWidgetLoadingError";
import { DocuSignWidgetPendingColumn } from "packages/features/documents/components/docusign/docuSignWidget/DocuSignWidgetPendingColumn";
import { DocuSignWidgetRecentColumn } from "packages/features/documents/components/docusign/docuSignWidget/DocuSignWidgetRecentColumn";
import { DocuSignWidgetStatsCards } from "packages/features/documents/components/docusign/docuSignWidget/DocuSignWidgetStatsCards";
import type { ListDocusignTemplate } from "packages/features/documents/components/docusign/docuSignWidget/useDocuSignWidgetController";
import { useDocuSignWidgetController } from "packages/features/documents/components/docusign/docuSignWidget/useDocuSignWidgetController";
import { DocuSignWidgetSavedTemplatesSection } from "packages/features/documents/components/docusign/DocuSignWidgetSavedTemplatesSection";
import { Box } from "packages/ui/components/primitives";

/** Dashboard DocuSign agreements widget: templates, stats, pending and recent lists. */
export default function DocuSignWidget() {
  const {
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
  } = useDocuSignWidgetController();

  if (isLoading) {
    return <DocuSignWidgetLoading />;
  }

  if (error) {
    return <DocuSignWidgetError />;
  }

  return (
    <>
      <Box className="border-border bg-background-surface rounded-lg border p-6">
        <DocuSignWidgetHeader
          onOpenTemplateWizard={() => setIsTemplateWizardOpen(true)}
          onOpenCreate={() => setIsCreateModalOpen(true)}
        />

        <DocuSignWidgetSavedTemplatesSection
          savedTemplates={savedTemplates as ListDocusignTemplate[]}
          onUseTemplate={(tid, name) => setUseTemplateCtx({ docusignTemplateId: tid, name })}
          onEditTemplate={(tid) => void openEditorMutation.mutateAsync(tid)}
          onDeleteTemplate={(tid) => void deleteTemplateMutation.mutateAsync(tid)}
          isEditPending={openEditorMutation.isPending}
          isDeletePending={deleteTemplateMutation.isPending}
        />

        <DocuSignWidgetStatsCards stats={stats} />

        <Box className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DocuSignWidgetPendingColumn
            pendingSignatures={pendingSignatures}
            onSelectAgreement={setSelectedAgreementId}
          />
          <DocuSignWidgetRecentColumn
            recentAgreements={recentAgreements}
            onSelectAgreement={setSelectedAgreementId}
          />
        </Box>

        <DocuSignWidgetFooter showViewAll={agreements.length > 0} />
      </Box>

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
