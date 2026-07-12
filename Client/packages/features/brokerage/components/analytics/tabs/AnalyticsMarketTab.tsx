import { BrokerageInventoryPanel } from "packages/features/brokerage/components/inventory/BrokerageInventoryPanel";
import { Box } from "packages/ui/components/structure/primitives";

export function AnalyticsMarketTab() {
  return (
    <Box className="flex flex-col gap-6" data-testid="analytics-market-tab">
      <BrokerageInventoryPanel />
    </Box>
  );
}
