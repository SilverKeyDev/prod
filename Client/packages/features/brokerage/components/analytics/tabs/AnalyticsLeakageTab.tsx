import { useMemo, useState } from "react";

import { color } from "packages/design-tokens";
import { AnalyticsDonutChart } from "packages/features/brokerage/components/charts";
import { useAncillaryAnalytics } from "packages/features/brokerage/hooks/useAncillaryAnalytics";
import { useBrokerageAnalytics } from "packages/features/brokerage/hooks/useBrokerageAnalytics";
import type { DeltaTone } from "packages/features/brokerage/utils/analytics/analyticsTokens";
import { buildLeakageMathExplanation } from "packages/features/brokerage/utils/analytics/leakageMathExplanation";
import {
  applyOfficeShareToAncillary,
  officeClosingsShare,
} from "packages/features/brokerage/utils/analytics/overviewTransforms";
import { formatCompactCurrency } from "packages/features/brokerage/utils/analyticsFormat";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { ANCILLARY_SERVICE_LABELS } from "packages/features/brokerage/utils/ancillaryServiceLabels";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import type { IconName } from "packages/ui/types/icons";

import { AnalyticsMotionSection } from "../AnalyticsMotionSection";
import { KpiCard, SectionCard, SectionHeading } from "../AnalyticsShellShared";
import { AncillaryAgentLeaderboardCard, AncillaryAttachRatesCard } from "../AncillaryInsightPanel";
import { QuantMathStrip } from "../QuantMathStrip";
import { ViewAllAgentsModal } from "../ViewAllAgentsModal";

type Props = {
  timePeriod: TimePeriod;
  /** Demo office filter; null/empty = brokerage-wide. */
  officeId?: string | null;
};

type SnapshotKpi = {
  label: string;
  value: string;
  iconName: IconName;
  valueColor?: string;
  delta?: string;
  deltaTone?: DeltaTone;
};

export function AnalyticsLeakageTab({ timePeriod, officeId = null }: Props) {
  const [showAllAgents, setShowAllAgents] = useState(false);
  const { data: ancillaryRaw, isLoading } = useAncillaryAnalytics(timePeriod);
  const { data: overview, agents } = useBrokerageAnalytics(timePeriod);

  const share = useMemo(
    () => officeClosingsShare(overview.production.officeRollups, officeId),
    [overview.production.officeRollups, officeId]
  );

  const ancillary = useMemo(
    () => applyOfficeShareToAncillary(ancillaryRaw, share),
    [ancillaryRaw, share]
  );

  const officeLabel = useMemo(() => {
    if (!officeId) return null;
    const match = overview.production.officeRollups.find((o) => o.office === officeId);
    return match?.office ?? officeId;
  }, [overview.production.officeRollups, officeId]);

  const explanation = useMemo(() => {
    const base = buildLeakageMathExplanation(ancillary, timePeriod);
    return {
      ...base,
      hero: { ...base.hero, valueColor: color("state.danger.DEFAULT") },
    };
  }, [ancillary, timePeriod]);

  const snapshotKpis = useMemo((): SnapshotKpi[] => {
    const snap = explanation.snapshot;
    if (!snap) return [];
    return [
      {
        label: "Opportunity to high",
        value: snap.opportunityToHigh,
        iconName: "dollar-sign",
        valueColor: color("state.danger.DEFAULT"),
      },
      {
        label: "vs industry avg",
        value: snap.vsIndustryAvg,
        iconName: "target",
        delta: snap.behindIndustryAvg ? "Behind average" : "At or above average",
        deltaTone: snap.behindIndustryAvg ? "down" : "flat",
      },
      {
        label: "Biggest leak",
        value: snap.biggestLeak,
        iconName: "trending-down",
      },
      {
        label: "Closings in period",
        value: snap.closingsInPeriod,
        iconName: "home",
      },
    ];
  }, [explanation.snapshot]);

  const revenueMix = useMemo(() => {
    const services = ancillary.by_service;
    const totalLeakage = Math.max(
      1,
      services.reduce((sum, row) => sum + row.leakage_dollars, 0)
    );
    return services.map((row) => ({
      label: ANCILLARY_SERVICE_LABELS[row.service] ?? row.service,
      value: Math.round((row.leakage_dollars / totalLeakage) * 100),
      detail: formatCompactCurrency(row.leakage_dollars),
    }));
  }, [ancillary]);

  const centerLabel = formatCompactCurrency(ancillary.summary.total_leakage_dollars);

  if (isLoading) {
    return (
      <Box className="p-6">
        <BodyText muted>Loading leakage…</BodyText>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col gap-8">
      {officeLabel ? (
        <BodyText size="xs" muted className="tabular-nums" data-testid="leakage-office-scope">
          Scoped to {officeLabel}
        </BodyText>
      ) : null}

      <AnalyticsMotionSection index={0} testId="leakage-section-snapshot">
        <SectionHeading title="Snapshot" iconName="activity" />
        <Box className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {snapshotKpis.map((kpi) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              iconName={kpi.iconName}
              valueColor={kpi.valueColor}
              delta={kpi.delta}
              deltaTone={kpi.deltaTone}
            />
          ))}
        </Box>
      </AnalyticsMotionSection>

      <AnalyticsMotionSection index={1} testId="leakage-section-opportunity">
        <SectionHeading title="Opportunity" iconName="trending-down" />
        <Box className="border-border-danger bg-background-surface rounded-xl border p-6">
          <QuantMathStrip explanation={explanation} testId="leakage-math-strip" hideStats />
        </Box>
      </AnalyticsMotionSection>

      <AnalyticsMotionSection index={2} testId="leakage-section-capture-mix">
        <SectionHeading title="Capture mix" iconName="grid-3x3" />
        <Box className="grid gap-4 lg:grid-cols-2">
          <Box className="min-w-0">
            <AncillaryAttachRatesCard services={ancillary.by_service} />
          </Box>
          <Box className="min-w-0">
            <SectionCard title="Service Revenue Mix" iconName="dollar-sign">
              <AnalyticsDonutChart
                data={revenueMix}
                centerLabel={centerLabel}
                centerSub="Opportunity to industry high"
                showEntropy
                height={300}
              />
            </SectionCard>
          </Box>
        </Box>
      </AnalyticsMotionSection>

      <AnalyticsMotionSection index={3} testId="leakage-section-agents">
        <SectionHeading title="Agents" iconName="users" />
        <AncillaryAgentLeaderboardCard
          data={ancillary}
          onViewAllAgents={() => setShowAllAgents(true)}
        />
      </AnalyticsMotionSection>

      {showAllAgents ? (
        <ViewAllAgentsModal
          open
          onClose={() => setShowAllAgents(false)}
          agents={agents}
          ancillaryByAgent={ancillary.by_agent}
          initialSort="opportunity"
        />
      ) : null}
    </Box>
  );
}
