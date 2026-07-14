import { color } from "packages/design-tokens";
import { SectionCard } from "packages/features/brokerage/components/analytics/AnalyticsShellShared";
import { AnalyticsBarChart } from "packages/features/brokerage/components/charts";
import type { AgentAncillaryData } from "packages/features/brokerage/utils/analytics/agentDetailTransforms";
import { formatCompactCurrency } from "packages/features/brokerage/utils/analyticsFormat";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

interface Props {
  ancillaryData: AgentAncillaryData;
}

export function AgentDetailAncillaryChart({ ancillaryData }: Props) {
  const chartColor = color("chart.1");
  const mutedColor = color("text.muted");
  const dangerColor = color("state.danger.DEFAULT");

  if (ancillaryData.services.length === 0) {
    return (
      <SectionCard title="Ancillary Attach Rates" iconName="link">
        <BodyText size="sm" muted>
          No ancillary service data available for this agent.
        </BodyText>
      </SectionCard>
    );
  }

  const chartData = ancillaryData.services.map((service) => ({
    label: service.service,
    value: service.agentRate,
  }));

  return (
    <SectionCard title="Ancillary Attach Rates" iconName="link">
      <Box className="h-64">
        <AnalyticsBarChart
          data={chartData}
          orientation="horizontal"
          height={Math.max(180, ancillaryData.services.length * 44)}
          unit="%"
          showDataLabels
          series={[
            {
              name: "This Agent",
              values: ancillaryData.services.map((s) => s.agentRate),
              color: chartColor,
              displayValues: ancillaryData.services.map((s) => `${s.agentRate}%`),
            },
            {
              name: "Brokerage Avg",
              values: ancillaryData.services.map((s) => s.brokerageAvg),
              color: mutedColor,
              displayValues: ancillaryData.services.map((s) => `${s.brokerageAvg}%`),
            },
          ]}
        />
      </Box>
      {ancillaryData.totalLeakage > 0 && (
        <BodyText size="xs" muted className="mt-3">
          Total estimated leakage:{" "}
          <BodyText as="span" style={{ color: dangerColor, fontWeight: 600 }}>
            {formatCompactCurrency(ancillaryData.totalLeakage)}
          </BodyText>
        </BodyText>
      )}
    </SectionCard>
  );
}
