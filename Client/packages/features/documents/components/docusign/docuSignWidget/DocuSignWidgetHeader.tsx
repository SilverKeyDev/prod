import { FileSignature } from "lucide-react";

import { useLocalization } from "packages/contexts";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/primitives";

import { Title } from "@/components/ui";

type DocuSignWidgetHeaderProps = {
  onOpenTemplateWizard: () => void;
  onOpenCreate: () => void;
};

export function DocuSignWidgetHeader({
  onOpenTemplateWizard,
  onOpenCreate,
}: DocuSignWidgetHeaderProps) {
  const { t } = useLocalization();
  return (
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
        <Button variant="secondary" size="sm" onPress={onOpenTemplateWizard} iconName="file-text">
          {t("docusign.widget_template", { defaultValue: "Template" })}
        </Button>
        <Button variant="primary" size="sm" onPress={onOpenCreate} iconName="plus">
          {t("docusign.widget_create", { defaultValue: "Create" })}
        </Button>
      </Box>
    </Box>
  );
}
