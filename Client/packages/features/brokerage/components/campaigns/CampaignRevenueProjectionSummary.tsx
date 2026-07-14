import { useMemo } from "react";

import { color } from "packages/design-tokens";
import { KpiCard } from "packages/features/brokerage/components/analytics/AnalyticsShellShared";
import { QuantMathStrip } from "packages/features/brokerage/components/analytics/QuantMathStrip";
import { AnalyticsLineChart } from "packages/features/brokerage/components/charts";
import { formatLiftPp } from "packages/features/brokerage/utils/analyticsFormat";
import { formatAncillaryDollars } from "packages/features/brokerage/utils/ancillaryServiceLabels";
import {
  DEMO_BROKERAGE_PERSONA_NOTE,
  VOLUME_ASSUMPTION_FOOTNOTE,
} from "packages/features/brokerage/utils/brokerageDemoVolumeAssumptions";
import { buildCampaignMathExplanation } from "packages/features/brokerage/utils/campaigns/campaignMathExplanation";
import type { CampaignRevenueProjections } from "packages/features/brokerage/utils/campaigns/campaignRevenueProjections";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

type Props = {
  projection: CampaignRevenueProjections;
};

export function CampaignRevenueProjectionSummary({ projection }: Props) {
  const yearSeries = useMemo(
    () =>
      projection.monthlyCumulative.map((point) => ({
        label: `M${point.month}`,
        value: point.cumulativeDollars,
      })),
    [projection.monthlyCumulative]
  );

  const moneyMarkPoints = useMemo(() => {
    const m6 = projection.monthlyCumulative.find((p) => p.month === 6);
    if (!m6) return [];
    return [
      {
        label: `M6: ${formatAncillaryDollars(m6.cumulativeDollars)}`,
        xIndex: 5,
        value: m6.cumulativeDollars,
      },
    ];
  }, [projection.monthlyCumulative]);

  const endValueLabel = useMemo(() => {
    const last = projection.monthlyCumulative[projection.monthlyCumulative.length - 1];
    return last ? formatAncillaryDollars(last.cumulativeDollars) : undefined;
  }, [projection.monthlyCumulative]);

  const topThree = useMemo(
    () => [...projection.rows].sort((a, b) => b.projectedDollars - a.projectedDollars).slice(0, 3),
    [projection.rows]
  );

  const explanation = useMemo(() => {
    const base = buildCampaignMathExplanation(projection);
    return {
      ...base,
      hero: { ...base.hero, valueColor: color("gold.DEFAULT") },
    };
  }, [projection]);

  return (
    <Box
      className="border-gold/40 bg-background-surface flex w-full flex-col gap-4 rounded-xl border p-5 shadow-sm"
      data-testid="campaign-revenue-projection-summary"
    >
      <BodyText size="xs" muted className="tabular-nums" data-testid="campaign-volume-footnote">
        Projected recovery (12 months) · {VOLUME_ASSUMPTION_FOOTNOTE} ·{" "}
        {DEMO_BROKERAGE_PERSONA_NOTE} · linear run-rate assumption
      </BodyText>

      <QuantMathStrip explanation={explanation} testId="campaign-math-strip" />

      {topThree.length > 0 ? (
        <Box className="grid gap-3 sm:grid-cols-3" data-testid="campaign-top-recovery-kpis">
          {topThree.map((row, index) => (
            <KpiCard
              key={row.categoryId}
              label={`#${index + 1} ${row.label}`}
              value={formatAncillaryDollars(row.projectedDollars)}
              delta={`+${formatLiftPp(row.liftPp)} pp lift`}
              deltaTone="up"
              sparkline={row.monthlyCumulative.map((p) => p.cumulativeDollars)}
              iconName="trending-up"
            />
          ))}
        </Box>
      ) : null}

      <Box data-testid="campaign-revenue-projection-year-series">
        <AnalyticsLineChart
          data={yearSeries}
          height={160}
          color={color("gold.DEFAULT")}
          showConfidenceBand={false}
          fillArea
          markPoints={moneyMarkPoints}
          endValueLabel={endValueLabel}
        />
      </Box>
    </Box>
  );
}
