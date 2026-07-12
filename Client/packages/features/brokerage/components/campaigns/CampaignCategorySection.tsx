import { useMemo } from "react";

import { color } from "packages/design-tokens";
import { CampaignSampleEmailCard } from "packages/features/brokerage/components/campaigns/CampaignSampleEmailCard";
import { AnalyticsLineChart } from "packages/features/brokerage/components/charts";
import { formatAncillaryDollars } from "packages/features/brokerage/utils/ancillaryServiceLabels";
import type { CategoryCampaign } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import type { CampaignRevenueProjectionRow } from "packages/features/brokerage/utils/campaigns/campaignRevenueProjections";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type CampaignCategorySectionProps = {
  category: CategoryCampaign;
  yearProjection: CampaignRevenueProjectionRow;
  onNewVariant: (category: CategoryCampaign) => void;
};

export function CampaignCategorySection({
  category,
  yearProjection,
  onNewVariant,
}: CampaignCategorySectionProps) {
  const attachLineData = useMemo(
    () =>
      category.performance_weekly.map((p) => ({
        label: `W${p.week}`,
        value: p.attach_rate_percent,
      })),
    [category.performance_weekly]
  );

  const openLineData = useMemo(
    () =>
      category.performance_weekly.map((p) => ({
        label: `W${p.week}`,
        value: p.open_rate_percent,
      })),
    [category.performance_weekly]
  );

  return (
    <Box
      id={category.id}
      className="border-border border-l-gold bg-background-surface flex scroll-mt-24 flex-col gap-4 rounded-xl border border-l-4 p-5"
      data-testid={`campaign-category-${category.id}`}
    >
      <Box className="flex flex-wrap items-center justify-between gap-3">
        <Box className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <Title size="md" as="h2">
            {category.label}
          </Title>
          <Box
            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
            data-testid={`campaign-category-year-projection-${category.id}`}
          >
            <BodyText size="sm" muted>
              12-mo recovery
            </BodyText>
            <BodyText size="sm" className="text-gold font-semibold tabular-nums">
              {formatAncillaryDollars(yearProjection.projectedDollars)}
            </BodyText>
            <BodyText size="xs" className="text-state-success tabular-nums">
              +{yearProjection.liftPp} pp
            </BodyText>
          </Box>
        </Box>
        <Button type="button" variant="primary" size="sm" onClick={() => onNewVariant(category)}>
          New variant
        </Button>
      </Box>

      <Box className="grid gap-3 md:grid-cols-2" data-testid={`campaign-emails-${category.id}`}>
        {category.emails.map((email) => (
          <CampaignSampleEmailCard key={email.id} email={email} />
        ))}
      </Box>

      <Box className="grid gap-4 md:grid-cols-2">
        <Box>
          <Title size="sm" as="h3" className="mb-2">
            Attach
          </Title>
          <AnalyticsLineChart data={attachLineData} height={200} showConfidenceBand={false} />
        </Box>
        <Box>
          <Title size="sm" as="h3" className="mb-2">
            Open
          </Title>
          <AnalyticsLineChart
            data={openLineData}
            height={200}
            color={color("gold.DEFAULT")}
            showConfidenceBand={false}
          />
        </Box>
      </Box>

      <Box data-testid={`campaign-insights-${category.id}`}>
        <Title size="sm" as="h3" className="mb-3">
          Insights
        </Title>
        <Box className="grid gap-4 md:grid-cols-2">
          <Box>
            <BodyText size="sm" className="mb-2 font-semibold">
              What worked
            </BodyText>
            <ul className="list-disc space-y-1 pl-4">
              {category.insights.what_worked.map((item) => (
                <li key={item}>
                  <BodyText size="xs">{item}</BodyText>
                </li>
              ))}
            </ul>
          </Box>
          <Box>
            <BodyText size="sm" className="mb-2 font-semibold">
              Why
            </BodyText>
            <ul className="list-disc space-y-1 pl-4">
              {category.insights.why_guesses.map((item) => (
                <li key={item}>
                  <BodyText size="xs">{item}</BodyText>
                </li>
              ))}
            </ul>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
