import { BrokerageAnalyticsShell } from "packages/features/brokerage/components/analytics/BrokerageAnalyticsShell";
import { WorkspacePlaceholderPage } from "packages/features/workspace";
import { Box } from "packages/ui/components/structure/primitives";

export function BrokerageDashboardShell() {
  return (
    <Box className="flex flex-col gap-8">
      <WorkspacePlaceholderPage workspace="brokerage" />
      <BrokerageAnalyticsShell />
    </Box>
  );
}
