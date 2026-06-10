import { ExternalLink } from "lucide-react";

import { useLocalization } from "packages/contexts";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import { getWindow } from "packages/utils/core/platform";

type DocuSignWidgetFooterProps = {
  showViewAll: boolean;
};

export function DocuSignWidgetFooter({ showViewAll }: DocuSignWidgetFooterProps) {
  const { t } = useLocalization();

  if (!showViewAll) {
    return null;
  }

  return (
    <Box className="border-border mt-4 border-t pt-4">
      <Button
        variant="ghost"
        size="sm"
        contentAlign="start"
        icon={<ExternalLink className="h-3.5 w-3.5" />}
        iconPosition="right"
        onPress={() => {
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
  );
}
