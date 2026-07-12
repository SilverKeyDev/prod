import { useMemo, useState } from "react";

import { Icon } from "@ui/icons";

import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import { UnderlineTabs } from "packages/ui/components/structure/tabs/UnderlineTabs";

import {
  type AnalyticsTab,
  DASHBOARD_TABS,
  TIME_PERIOD_OPTIONS,
  type TimePeriod,
} from "./analyticsShellConstants";
import { AnalyticsAgentsTab } from "./tabs/AnalyticsAgentsTab";
import { AnalyticsForensicsTab } from "./tabs/AnalyticsForensicsTab";
import { AnalyticsLeakageTab } from "./tabs/AnalyticsLeakageTab";
import { AnalyticsMarketTab } from "./tabs/AnalyticsMarketTab";
import { AnalyticsOverviewTab } from "./tabs/AnalyticsOverviewTab";

export function BrokerageAnalyticsShell() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");

  const tabItems = useMemo(
    () =>
      DASHBOARD_TABS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        icon: <Icon name={tab.iconName} className="h-full w-full" />,
      })),
    []
  );

  return (
    <Box className="flex flex-col gap-6 p-6">
      <Box className="border-border flex flex-wrap items-center justify-between gap-3 border-b">
        <Box className="min-w-0 flex-1 [&>*]:border-b-0">
          <UnderlineTabs
            items={tabItems}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as AnalyticsTab)}
            size="sm"
            scrollable
          />
        </Box>

        <Box className="flex shrink-0 items-center gap-2 pb-2">
          {TIME_PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              size="sm"
              variant={timePeriod === opt.value ? "primary" : "ghost"}
              onPress={() => setTimePeriod(opt.value)}
              className={
                timePeriod === opt.value
                  ? "rounded-lg"
                  : "rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
            >
              {opt.label}
            </Button>
          ))}
        </Box>
      </Box>

      {activeTab === "overview" && <AnalyticsOverviewTab timePeriod={timePeriod} />}
      {activeTab === "agents" && <AnalyticsAgentsTab timePeriod={timePeriod} />}
      {activeTab === "leakage" && <AnalyticsLeakageTab timePeriod={timePeriod} />}
      {activeTab === "forensics" && <AnalyticsForensicsTab timePeriod={timePeriod} />}
      {activeTab === "market" && <AnalyticsMarketTab timePeriod={timePeriod} />}
    </Box>
  );
}
