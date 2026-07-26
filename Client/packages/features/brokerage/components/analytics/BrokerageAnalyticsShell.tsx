import { useCallback, useEffect, useMemo, useState } from "react";

import { Icon } from "@ui/icons";

import { useBrokerageAnalytics } from "packages/features/brokerage/hooks/useBrokerageAnalytics";
import {
  DEMO_BROKERAGE_PERSONA_NOTE,
  VOLUME_ASSUMPTION_FOOTNOTE,
} from "packages/features/brokerage/utils/brokerageDemoVolumeAssumptions";
import { useNavigation } from "packages/navigation";
import { Button, Dropdown } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import { UnderlineTabs } from "packages/ui/components/structure/tabs/UnderlineTabs";
import BodyText from "packages/ui/components/structure/text/BodyText";

import {
  type AnalyticsTab,
  DASHBOARD_TABS,
  TIME_PERIOD_OPTIONS,
  type TimePeriod,
} from "./analyticsShellConstants";
import { AnalyticsAgentsTab } from "./tabs/AnalyticsAgentsTab";
import { AnalyticsAskTab } from "./tabs/AnalyticsAskTab";
import { AnalyticsForensicsTab } from "./tabs/AnalyticsForensicsTab";
import { AnalyticsLeakageTab } from "./tabs/AnalyticsLeakageTab";
import { AnalyticsMarketTab } from "./tabs/AnalyticsMarketTab";
import { AnalyticsOverviewTab } from "./tabs/AnalyticsOverviewTab";

const TAB_IDS = new Set<string>(DASHBOARD_TABS.map((tab) => tab.id));
const ALL_OFFICES = "";

function parseAnalyticsTab(value: string | null): AnalyticsTab | null {
  if (value && TAB_IDS.has(value)) return value as AnalyticsTab;
  return null;
}

export function BrokerageAnalyticsShell() {
  const { getSearchParams, setSearchParams } = useNavigation();
  const tabParam = getSearchParams().get("tab");

  const [timePeriod, setTimePeriod] = useState<TimePeriod>("year");
  const [officeId, setOfficeId] = useState<string>(ALL_OFFICES);
  const [activeTab, setActiveTab] = useState<AnalyticsTab>(
    () => parseAnalyticsTab(tabParam) ?? "overview"
  );

  const { data } = useBrokerageAnalytics(timePeriod);
  const officeOptions = useMemo(
    () => [
      { value: ALL_OFFICES, label: "All offices" },
      ...data.production.officeRollups.map((o) => ({
        value: o.office,
        label: o.office,
      })),
    ],
    [data.production.officeRollups]
  );

  useEffect(() => {
    const fromUrl = parseAnalyticsTab(tabParam);
    if (fromUrl) {
      setActiveTab(fromUrl);
    }
  }, [tabParam]);

  const handleTabChange = useCallback(
    (id: string) => {
      const next = parseAnalyticsTab(id) ?? "overview";
      setActiveTab(next);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === "overview") {
            params.delete("tab");
          } else {
            params.set("tab", next);
          }
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const tabItems = useMemo(
    () =>
      DASHBOARD_TABS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        icon: <Icon name={tab.iconName} className="h-full w-full" />,
      })),
    []
  );

  const scopedOfficeId = officeId || null;

  return (
    <Box className="flex flex-col gap-6 p-6">
      <Box className="border-border flex flex-wrap items-center justify-between gap-3 border-b">
        <Box className="min-w-0 flex-1 [&>*]:border-b-0">
          <UnderlineTabs
            items={tabItems}
            activeId={activeTab}
            onChange={handleTabChange}
            size="sm"
            scrollable
          />
        </Box>

        <Box className="flex shrink-0 flex-wrap items-center gap-2 pb-2">
          <Box className="w-[14rem] shrink-0" data-testid="analytics-office-dropdown">
            <Dropdown<string>
              label="Office"
              hideLabel
              options={officeOptions}
              value={officeId}
              onChange={setOfficeId}
              placeholder="All offices"
              size="sm"
              variant="compact"
              searchable
              className="w-full"
            />
          </Box>
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

      <BodyText size="xs" muted className="tabular-nums" data-testid="volume-assumption-footnote">
        {VOLUME_ASSUMPTION_FOOTNOTE} · {DEMO_BROKERAGE_PERSONA_NOTE}
      </BodyText>

      {activeTab === "overview" && (
        <AnalyticsOverviewTab timePeriod={timePeriod} officeId={scopedOfficeId} />
      )}
      {activeTab === "ask" && <AnalyticsAskTab />}
      {activeTab === "leakage" && (
        <AnalyticsLeakageTab timePeriod={timePeriod} officeId={scopedOfficeId} />
      )}
      {activeTab === "agents" && <AnalyticsAgentsTab timePeriod={timePeriod} />}
      {activeTab === "forensics" && <AnalyticsForensicsTab timePeriod={timePeriod} />}
      {activeTab === "market" && <AnalyticsMarketTab timePeriod={timePeriod} />}
    </Box>
  );
}
