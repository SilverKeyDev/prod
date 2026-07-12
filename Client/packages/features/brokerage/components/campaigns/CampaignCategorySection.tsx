import { useMemo } from "react";

import { CampaignSampleEmailCard } from "packages/features/brokerage/components/campaigns/CampaignSampleEmailCard";
import { AnalyticsLineChart } from "packages/features/brokerage/components/charts";
import type { CategoryCampaign } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type CampaignCategorySectionProps = {
  category: CategoryCampaign;
  onNewVariant: (category: CategoryCampaign) => void;
};

export function CampaignCategorySection({ category, onNewVariant }: CampaignCategorySectionProps) {
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
      className="border-border bg-background-surface flex scroll-mt-24 flex-col gap-4 rounded-xl border p-5"
      data-testid={`campaign-category-${category.id}`}
    >
      <Box className="flex flex-wrap items-center justify-between gap-3">
        <Title size="md" as="h2">
          {category.label}
        </Title>
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
          <AnalyticsLineChart data={openLineData} height={200} showConfidenceBand={false} />
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
