import { KpiCard } from "packages/features/brokerage/components/analytics/AnalyticsShellShared";
import type { AgentKpis } from "packages/features/brokerage/utils/analytics/agentDetailTransforms";
import { formatCompactCurrency } from "packages/features/brokerage/utils/analyticsFormat";
import { Box } from "packages/ui/components/structure/primitives";

interface Props {
  kpis: AgentKpis;
}

export function AgentDetailKpis({ kpis }: Props) {
  return (
    <Box className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Total Closings" value={kpis.totalClosings} iconName="home" />
      <KpiCard
        label="Total Volume"
        value={formatCompactCurrency(kpis.totalVolume)}
        iconName="dollar-sign"
      />
      <KpiCard
        label="Total GCI"
        value={formatCompactCurrency(kpis.totalGci)}
        iconName="trending-up"
      />
      <KpiCard label="Active Clients" value={kpis.activeClients} iconName="users" />
      <KpiCard
        label="90d Momentum"
        value={`${kpis.momentum90d > 0 ? "+" : ""}${kpis.momentum90d}%`}
        iconName="activity"
      />
      {kpis.fallThroughRate !== null && (
        <KpiCard
          label="Fall-Through Rate"
          value={`${kpis.fallThroughRate}%`}
          iconName="alert-triangle"
        />
      )}
      {kpis.estimatedLeakage !== null && (
        <KpiCard
          label="Opp. to industry high"
          value={formatCompactCurrency(kpis.estimatedLeakage)}
          iconName="leak"
        />
      )}
      {kpis.stallStage && <KpiCard label="Stall Stage" value={kpis.stallStage} iconName="pause" />}
    </Box>
  );
}
