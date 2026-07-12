import { useMemo } from "react";

import { AnalyticsDonutChart } from "packages/features/brokerage/components/charts";
import { useAncillaryAnalytics } from "packages/features/brokerage/hooks/useAncillaryAnalytics";
import { formatCompactCurrency } from "packages/features/brokerage/utils/analyticsFormat";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { ANCILLARY_SERVICE_LABELS } from "packages/features/brokerage/utils/ancillaryServiceLabels";
import { Link } from "packages/navigation";
import { ROUTES } from "packages/navigation/types/routes";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

import { SectionCard } from "../AnalyticsShellShared";
import { AncillaryInsightPanel } from "../AncillaryInsightPanel";

type Props = {
  timePeriod: TimePeriod;
};

export function AnalyticsLeakageTab({ timePeriod }: Props) {
  const { data: ancillary, isLoading } = useAncillaryAnalytics(timePeriod);

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
    <Box className="flex flex-col gap-6">
      <Box className="border-border bg-background-surface rounded-xl border p-5">
        <Title size="sm" as="h3" className="mb-1">
          Ancillary Capture Leakage
        </Title>
        <BodyText size="xs" muted className="mb-2">
          Revenue leaking to outside title, lending, escrow, and home warranty vendors
        </BodyText>
        <BodyText size="xs" className="mb-4">
          <Link to={ROUTES.CAMPAIGNS} className="underline underline-offset-2">
            Run a campaign to recover attach rate →
          </Link>
        </BodyText>
        <AncillaryInsightPanel data={ancillary} />
      </Box>
      <SectionCard title="Service Revenue Mix">
        <AnalyticsDonutChart
          data={revenueMix}
          centerLabel={centerLabel}
          centerSub="total leakage"
          showEntropy
          height={300}
        />
      </SectionCard>
    </Box>
  );
}
