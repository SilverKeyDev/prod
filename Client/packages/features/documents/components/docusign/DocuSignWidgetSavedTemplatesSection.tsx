import type { ReactElement } from "react";

import { useLocalization } from "packages/contexts";
import type { DocusignTemplate } from "packages/features/documents/types/docusign";
import Button from "packages/ui/components/button/Button";
import { Box } from "packages/ui/components/primitives";
import { getWindow } from "packages/utils/platform";

import { BodyText, Title } from "@/components/ui";

/** Cached template row from GET /docusign/templates (may include legacy `docusign_template_id`). */
export type ListDocusignTemplate = DocusignTemplate & { docusign_template_id?: string };

export type DocuSignWidgetSavedTemplatesSectionProps = {
  savedTemplates: ListDocusignTemplate[];
  onUseTemplate: (docusignTemplateId: string, name: string) => void;
  onEditTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  isEditPending: boolean;
  isDeletePending: boolean;
};

export function DocuSignWidgetSavedTemplatesSection({
  savedTemplates,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
  isEditPending,
  isDeletePending,
}: DocuSignWidgetSavedTemplatesSectionProps): ReactElement | null {
  const { t } = useLocalization();

  if (savedTemplates.length === 0) return null;

  return (
    <Box className="mb-6">
      <Title as="h3" size="sm" className="text-text-primary mb-2 font-medium">
        {t("docusign.widget_templates_heading", { defaultValue: "Templates" })}
      </Title>
      <Box className="space-y-2">
        {savedTemplates.map((tmpl) => {
          const row = tmpl;
          const tid = row.template_id || row.docusign_template_id || "";
          const label = row.name || tid;
          return (
            <Box
              key={row.id ?? tid}
              className="border-border flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <BodyText size="sm" className="text-text-primary font-medium">
                {label}
              </BodyText>
              <Box className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={() => onUseTemplate(tid, label)}>
                  {t("docusign.widget_template_use", { defaultValue: "Use" })}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={isEditPending}
                  onClick={() => onEditTemplate(tid)}
                >
                  {t("docusign.widget_template_edit", { defaultValue: "Edit in DocuSign" })}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  loading={isDeletePending}
                  onClick={() => {
                    const w = getWindow();
                    if (
                      w?.confirm(
                        t("docusign.widget_template_delete_confirm", {
                          defaultValue: "Delete this template?",
                        })
                      )
                    ) {
                      onDeleteTemplate(tid);
                    }
                  }}
                >
                  {t("docusign.widget_template_delete", { defaultValue: "Delete" })}
                </Button>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
