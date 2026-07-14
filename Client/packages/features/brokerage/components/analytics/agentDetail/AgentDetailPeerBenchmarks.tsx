import { color } from "packages/design-tokens";
import { SectionCard } from "packages/features/brokerage/components/analytics/AnalyticsShellShared";
import { AnalyticsBarChart } from "packages/features/brokerage/components/charts";
import type { AgentPeerBenchmarks } from "packages/features/brokerage/utils/analytics/agentDetailTransforms";
import { formatCompactCurrency } from "packages/features/brokerage/utils/analyticsFormat";
import { Box } from "packages/ui/components/structure/primitives";

interface Props {
  peerBenchmarks: AgentPeerBenchmarks;
}

export function AgentDetailPeerBenchmarks({ peerBenchmarks }: Props) {
  const chartColor = color("chart.1");
  const mutedColor = color("text.muted");

  const benchmarkData = [
    {
      label: "Closings",
      agent: peerBenchmarks.closings.agent,
      brokerageAvg: peerBenchmarks.closings.brokerageAvg,
      agentDisplay: peerBenchmarks.closings.agent.toString(),
      avgDisplay: peerBenchmarks.closings.brokerageAvg.toString(),
    },
    {
      label: "Volume",
      agent: peerBenchmarks.volume.agent / 1_000_000,
      brokerageAvg: peerBenchmarks.volume.brokerageAvg / 1_000_000,
      agentDisplay: formatCompactCurrency(peerBenchmarks.volume.agent),
      avgDisplay: formatCompactCurrency(peerBenchmarks.volume.brokerageAvg),
    },
    {
      label: "GCI",
      agent: peerBenchmarks.gci.agent / 1_000,
      brokerageAvg: peerBenchmarks.gci.brokerageAvg / 1_000,
      agentDisplay: formatCompactCurrency(peerBenchmarks.gci.agent),
      avgDisplay: formatCompactCurrency(peerBenchmarks.gci.brokerageAvg),
    },
  ];

  if (peerBenchmarks.fallThroughRate.agent !== null) {
    benchmarkData.push({
      label: "Fall-Through %",
      agent: peerBenchmarks.fallThroughRate.agent,
      brokerageAvg: peerBenchmarks.fallThroughRate.brokerageAvg,
      agentDisplay: `${peerBenchmarks.fallThroughRate.agent}%`,
      avgDisplay: `${peerBenchmarks.fallThroughRate.brokerageAvg}%`,
    });
  }

  const chartLabels = benchmarkData.map((d) => d.label);

  return (
    <SectionCard title="Peer Benchmarks" iconName="bar-chart-3">
      <Box className="h-72">
        <AnalyticsBarChart
          data={chartLabels.map((label) => ({ label, value: 0 }))}
          orientation="vertical"
          height={280}
          showDataLabels
          series={[
            {
              name: "This Agent",
              values: benchmarkData.map((d) => d.agent),
              color: chartColor,
              displayValues: benchmarkData.map((d) => d.agentDisplay),
            },
            {
              name: "Brokerage Avg",
              values: benchmarkData.map((d) => d.brokerageAvg),
              color: mutedColor,
              displayValues: benchmarkData.map((d) => d.avgDisplay),
            },
          ]}
        />
      </Box>
    </SectionCard>
  );
}
