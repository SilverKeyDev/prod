import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText } from "@/components/ui";

import type { DocuSignWidgetStats } from "./docuSignWidgetModel";

type DocuSignWidgetStatsCardsProps = {
  stats: DocuSignWidgetStats;
};

export function DocuSignWidgetStatsCards({ stats }: DocuSignWidgetStatsCardsProps) {
  const { t } = useLocalization();
  return (
    <Box className="mb-6 grid grid-cols-3 gap-3">
      <Box className="border-border-card-subtle bg-accent-muted rounded-lg border p-3 text-center">
        <Box className="text-text-primary text-2xl font-bold">{stats.totalPending}</Box>
        <BodyText size="xs" muted>
          {t("docusign.widget_stat_pending", { defaultValue: "Pending" })}
        </BodyText>
      </Box>

      <Box className="border-border-card-subtle bg-primary-muted rounded-lg border p-3 text-center">
        <Box className="text-primary text-2xl font-bold">{stats.completedThisWeek}</Box>
        <BodyText size="xs" muted>
          {t("docusign.widget_stat_this_week", {
            defaultValue: "This Week",
          })}
        </BodyText>
      </Box>

      <Box className="border-border-card-subtle bg-background-surface rounded-lg border p-3 text-center">
        <Box className="text-destructive text-2xl font-bold">{stats.voidedThisMonth}</Box>
        <BodyText size="xs" muted>
          {t("docusign.widget_stat_voided", { defaultValue: "Voided" })}
        </BodyText>
      </Box>
    </Box>
  );
}
