import { color } from "packages/design-tokens";
import { SectionCard } from "packages/features/brokerage/components/analytics/AnalyticsShellShared";
import { AnalyticsDonutChart } from "packages/features/brokerage/components/charts";
import type { AgentForensicsData } from "packages/features/brokerage/utils/analytics/agentDetailTransforms";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

interface Props {
  forensicsData: AgentForensicsData;
}

export function AgentDetailForensics({ forensicsData }: Props) {
  const dangerColor = color("state.danger.DEFAULT");

  if (forensicsData.totalDeals === 0) {
    return (
      <SectionCard title="Deal Forensics" iconName="search">
        <BodyText size="sm" muted>
          No deal forensics data available for this agent.
        </BodyText>
      </SectionCard>
    );
  }

  const donutData = forensicsData.failureStages.map((stage, index) => ({
    label: stage.stage,
    value: stage.share,
    color: [
      color("chart.1"),
      color("chart.2"),
      color("chart.3"),
      color("chart.4"),
      color("text.muted"),
    ][index % 5],
  }));

  return (
    <SectionCard title="Deal Forensics" iconName="search">
      <Box className="grid gap-6 md:grid-cols-2">
        <Box>
          <Box className="grid gap-4 sm:grid-cols-2">
            <Box className="rounded-lg bg-gray-50 p-4">
              <BodyText size="xs" muted>
                Fall-Through Rate
              </BodyText>
              <Title
                size="lg"
                style={{
                  color: forensicsData.fallThroughRate > 5 ? dangerColor : color("text.DEFAULT"),
                }}
              >
                {forensicsData.fallThroughRate}%
              </Title>
            </Box>
            <Box className="rounded-lg bg-gray-50 p-4">
              <BodyText size="xs" muted>
                Cancelled Deals
              </BodyText>
              <Title size="lg">
                {forensicsData.cancelled} / {forensicsData.totalDeals}
              </Title>
            </Box>
          </Box>
        </Box>

        {donutData.length > 0 && (
          <Box>
            <Title size="sm" className="mb-3">
              Failure Stage Distribution
            </Title>
            <Box className="h-48">
              <AnalyticsDonutChart data={donutData} height={180} showLegend />
            </Box>
          </Box>
        )}
      </Box>
    </SectionCard>
  );
}
