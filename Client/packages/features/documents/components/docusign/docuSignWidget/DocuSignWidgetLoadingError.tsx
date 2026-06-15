import { useLocalization } from "packages/contexts";
import KeyTurnLoader from "packages/ui/components/media/asset/loading/KeyTurnLoader.web";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText } from "@/components/ui";

export function DocuSignWidgetLoading() {
  const { t } = useLocalization();
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

export function DocuSignWidgetError() {
  const { t } = useLocalization();
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
