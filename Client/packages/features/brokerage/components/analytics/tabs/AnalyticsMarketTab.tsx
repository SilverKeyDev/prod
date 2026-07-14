import { BrokerageInventoryPanel } from "packages/features/brokerage/components/inventory/BrokerageInventoryPanel";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { Box } from "packages/ui/components/structure/primitives";

type Props = {
  timePeriod: TimePeriod;
};

export function AnalyticsMarketTab({ timePeriod }: Props) {
  return (
    <Box className="flex flex-col gap-6" data-testid="analytics-market-tab">
      <BrokerageInventoryPanel timePeriod={timePeriod} />
    </Box>
  );
}
