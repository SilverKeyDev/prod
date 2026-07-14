import { useMemo, useState } from "react";

import { CampaignSampleEmailCard } from "packages/features/brokerage/components/campaigns/CampaignSampleEmailCard";
import { CampaignVariantComparisonCharts } from "packages/features/brokerage/components/campaigns/CampaignVariantComparisonCharts";
import { formatLiftPp } from "packages/features/brokerage/utils/analyticsFormat";
import { formatAncillaryDollars } from "packages/features/brokerage/utils/ancillaryServiceLabels";
import { YEAR_TRANSACTIONS } from "packages/features/brokerage/utils/brokerageDemoVolumeAssumptions";
import type {
  CategoryCampaign,
  SampleEmail,
} from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import {
  CAMPAIGN_STATUS_LABELS,
  campaignStatusBadgeVariant,
  formatCampaignWindow,
  isControlEmail,
} from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import { formulaRowForCampaign } from "packages/features/brokerage/utils/campaigns/campaignMathExplanation";
import type { CampaignRevenueProjectionRow } from "packages/features/brokerage/utils/campaigns/campaignRevenueProjections";
import { buildSuggestedNextVariant } from "packages/features/brokerage/utils/campaigns/campaignSuggestedNext";
import { buildVariantRateComparisonSeries } from "packages/features/brokerage/utils/campaigns/campaignVariantRateComparison";
import { buildVariantSignificance } from "packages/features/brokerage/utils/campaigns/campaignVariantSignificance";
import { Button } from "packages/ui";
import StatusBadge from "packages/ui/components/media/asset/StatusBadge";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import { CardCarousel } from "packages/ui/components/surfaces/cards/base/index.web";

type CampaignCategorySectionProps = {
  category: CategoryCampaign;
  yearProjection?: CampaignRevenueProjectionRow;
  onNewVariant: (category: CategoryCampaign) => void;
  onOpenSettings?: (category: CategoryCampaign) => void;
  onOpenEmail?: (category: CategoryCampaign, email: SampleEmail) => void;
  onEditEmail?: (category: CategoryCampaign, email: SampleEmail) => void;
  onRemoveControl?: (categoryId: CategoryCampaign["id"]) => void;
  onIncludeControl?: (categoryId: CategoryCampaign["id"]) => void;
};

export function CampaignCategorySection({
  category,
  yearProjection,
  onNewVariant,
  onOpenSettings,
  onOpenEmail,
  onEditEmail,
  onRemoveControl,
  onIncludeControl,
}: CampaignCategorySectionProps) {
  const [mathOpen, setMathOpen] = useState(false);
  const baseline = category.baseline_attach_rate_percent;
  const post = category.post_attach_rate_percent;
  const hasControl = category.emails.some(isControlEmail);
  const statusLabel = CAMPAIGN_STATUS_LABELS[category.status];
  const windowText = formatCampaignWindow(category.startedAt, category.cadence);

  const methodology = useMemo(() => {
    if (!yearProjection) return null;
    return formulaRowForCampaign(yearProjection, YEAR_TRANSACTIONS);
  }, [yearProjection]);

  const significanceByVariant = useMemo(() => {
    const rows = buildVariantSignificance(category.emails);
    return new Map(rows.map((row) => [row.variantKey, row]));
  }, [category.emails]);

  const suggestedNext = useMemo(() => {
    const { liftVsControlPp } = buildVariantRateComparisonSeries(category.emails, "attach");
    return buildSuggestedNextVariant(category.emails, liftVsControlPp);
  }, [category.emails]);

  return (
    <Box
      id={category.id}
      className="border-border bg-background-surface flex min-w-0 scroll-mt-24 flex-col gap-4 rounded-xl border p-5 shadow-sm"
      data-testid={`campaign-category-${category.id}`}
    >
      <Box className="flex flex-wrap items-center justify-between gap-3">
        <Box className="flex min-w-0 flex-col gap-1">
          <Box className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <Title size="md" as="h2">
              {category.label}
            </Title>
            <Box data-testid={`campaign-status-${category.id}`}>
              <StatusBadge
                text={statusLabel}
                variant={campaignStatusBadgeVariant(category.status)}
                size="xs"
              />
            </Box>
            <BodyText
              size="xs"
              muted
              className="tabular-nums"
              data-testid={`campaign-window-${category.id}`}
            >
              {windowText}
            </BodyText>
            {yearProjection ? (
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
                  +{formatLiftPp(yearProjection.liftPp)} pp
                </BodyText>
              </Box>
            ) : null}
          </Box>
          {yearProjection && baseline != null && post != null ? (
            <BodyText
              size="xs"
              muted
              className="tabular-nums"
              data-testid={`campaign-category-math-${category.id}`}
            >
              {baseline}% → {post}% · +{yearProjection.incrementalAttaches} attaches ·{" "}
              {formatAncillaryDollars(yearProjection.feeAssumption)}/attach
            </BodyText>
          ) : null}
          {yearProjection == null &&
          (category.fee_assumption == null ||
            category.baseline_attach_rate_percent == null ||
            category.post_attach_rate_percent == null) ? (
            <BodyText size="xs" muted data-testid={`campaign-category-set-targets-${category.id}`}>
              Set attach target and fee to include this campaign in recovery projections.
            </BodyText>
          ) : null}
        </Box>
        <Box className="flex flex-wrap items-center gap-2">
          {onOpenSettings ? (
            <Box data-testid={`campaign-settings-${category.id}`}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onOpenSettings(category)}
              >
                Settings
              </Button>
            </Box>
          ) : null}
          {hasControl && onRemoveControl ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onRemoveControl(category.id)}
              data-testid={`campaign-remove-control-${category.id}`}
            >
              Remove control group
            </Button>
          ) : null}
          {!hasControl && onIncludeControl ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onIncludeControl(category.id)}
              data-testid={`campaign-include-control-${category.id}`}
            >
              Include control group
            </Button>
          ) : null}
          <Button type="button" variant="primary" size="sm" onClick={() => onNewVariant(category)}>
            New variant
          </Button>
        </Box>
      </Box>

      {methodology ? (
        <Box className="border-border rounded-lg border px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onPress={() => setMathOpen((open) => !open)}
            data-testid={`campaign-methodology-toggle-${category.id}`}
          >
            {mathOpen ? "Hide calculation" : "How we calculated this"}
          </Button>
          {mathOpen ? (
            <Box
              className="mt-2 flex flex-col gap-1"
              data-testid={`campaign-methodology-${category.id}`}
            >
              <BodyText size="xs" muted>
                {methodology.inputs}
              </BodyText>
              <BodyText size="xs" className="tabular-nums leading-relaxed">
                {methodology.equation}
              </BodyText>
            </Box>
          ) : null}
        </Box>
      ) : null}

      {suggestedNext ? (
        <Box
          className="border-gold/30 bg-gold-muted/20 flex flex-col gap-1 rounded-lg border px-4 py-3"
          data-testid={`campaign-suggested-next-${category.id}`}
        >
          <BodyText size="xs" className="text-gold font-medium">
            {suggestedNext.title}
          </BodyText>
          <BodyText size="sm">{suggestedNext.reason}</BodyText>
        </Box>
      ) : null}

      <CampaignVariantComparisonCharts categoryId={category.id} emails={category.emails} />

      <Box
        className="w-full min-w-0 max-w-full overflow-hidden"
        data-testid={`campaign-emails-${category.id}`}
      >
        <CardCarousel
          items={category.emails}
          renderItem={(email: SampleEmail) => (
            <CampaignSampleEmailCard
              email={email}
              categoryLabel={category.label}
              significance={significanceByVariant.get(email.variant_key) ?? null}
              onOpen={
                onOpenEmail && !isControlEmail(email) ? (e) => onOpenEmail(category, e) : undefined
              }
              onEdit={
                onEditEmail && !isControlEmail(email) ? (e) => onEditEmail(category, e) : undefined
              }
            />
          )}
          getItemKey={(email: SampleEmail) => email.id}
          cardBasis="min(26rem, 88%)"
          cardGap={12}
          showNavigation
          ariaLabel={`${category.label} email variants`}
          emptyMessage="No variants yet. Create one to launch this campaign."
        />
      </Box>
    </Box>
  );
}
