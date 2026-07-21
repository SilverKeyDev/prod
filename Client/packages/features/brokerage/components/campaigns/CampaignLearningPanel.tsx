/**
 * CampaignLearningPanel — SIL-309
 *
 * One-click learning loop on the Campaigns page (SIL-306/307):
 * winner analysis → what-worked review → drafted next A/B pair (approval required).
 */
import { useEffect, useMemo, useState } from "react";

import { color } from "packages/design-tokens";
import { KpiCard } from "packages/features/brokerage/components/analytics/AnalyticsShellShared";
import { AnalyticsBarChart } from "packages/features/brokerage/components/charts";
import {
  useCampaignLearning,
  useCampaignList,
  useCampaignResults,
  useResolvedBrokerageOrgId,
  useRunCampaignLearningLoop,
} from "packages/features/brokerage/hooks/useCampaignLearning";
import type { CampaignLearningResult } from "packages/features/brokerage/types/campaignLearning";
import { formatLiftPp } from "packages/features/brokerage/utils/analyticsFormat";
import { formatAncillaryDollars } from "packages/features/brokerage/utils/ancillaryServiceLabels";
import { Button } from "packages/ui";
import Select from "packages/ui/components/inputs/form/pickers/Select";
import StatusBadge from "packages/ui/components/media/asset/StatusBadge";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

function formatPctRate(rate: number | undefined): string {
  if (rate == null) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

function InsightList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <BodyText size="xs" muted>
        —
      </BodyText>
    );
  }
  return (
    <Box className="flex flex-col gap-1.5">
      {items.map((item) => (
        <Box key={item} className="flex gap-2">
          <BodyText size="xs" muted className="shrink-0" aria-hidden>
            ·
          </BodyText>
          <BodyText size="xs">{item}</BodyText>
        </Box>
      ))}
    </Box>
  );
}

function LearningOutput({ result }: { result: CampaignLearningResult }) {
  const winner = result.winner_analysis;
  const draft = result.next_iteration_draft;
  const successColor = color("state.success.DEFAULT");
  const modelLabel = winner.model?.chosen_model ?? "—";
  const aucLabel =
    winner.model?.chosen_auc != null ? `AUC ${winner.model.chosen_auc.toFixed(2)}` : null;

  return (
    <Box className="flex flex-col gap-4" data-testid="campaign-learning-output">
      <Box className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Model winner"
          value={winner.winner_variant ? `Variant ${winner.winner_variant}` : "—"}
          delta={
            winner.winner_attach_rate != null
              ? `Attach ${formatPctRate(winner.winner_attach_rate)}`
              : undefined
          }
          deltaTone="up"
          iconName="sparkles"
          valueColor={successColor}
        />
        <KpiCard
          label="Scoring model"
          value={modelLabel}
          delta={aucLabel ?? winner.model?.rationale}
          iconName="trending-up"
        />
        <KpiCard
          label="Draft status"
          value={draft.status.replace(/_/g, " ")}
          delta="Human approval required · never auto-sent"
          iconName="file"
        />
      </Box>

      {(winner.drivers ?? []).length > 0 ? (
        <Box className="border-border/60 flex flex-col gap-1.5 border-t pt-3">
          <BodyText size="xs" muted className="font-medium uppercase tracking-wide">
            Why it won
          </BodyText>
          <InsightList items={winner.drivers ?? []} />
          {winner.model?.rationale ? (
            <BodyText size="xs" muted className="mt-1">
              {winner.model.rationale}
            </BodyText>
          ) : null}
        </Box>
      ) : null}

      <Box className="grid gap-3 md:grid-cols-2">
        <Box className="border-border bg-background rounded-lg border p-4">
          <Box className="mb-2 flex items-center gap-2">
            <Title size="sm" as="h4">
              What worked
            </Title>
            <StatusBadge text={result.review.source} variant="info" size="xs" />
          </Box>
          <InsightList items={result.review.what_worked ?? []} />
        </Box>
        <Box className="border-border bg-background rounded-lg border p-4">
          <Title size="sm" as="h4" className="mb-2">
            What didn&apos;t
          </Title>
          <InsightList items={result.review.what_did_not_work ?? []} />
        </Box>
      </Box>

      {result.review.recommended_next_test ? (
        <BodyText size="sm" className="text-gold">
          Next test: {result.review.recommended_next_test}
        </BodyText>
      ) : null}

      <Box className="border-border/60 flex flex-col gap-3 border-t pt-3">
        <Box className="flex flex-wrap items-center gap-2">
          <Title size="sm" as="h4">
            Next-iteration draft
          </Title>
          <StatusBadge text="Approval required" variant="warning" size="xs" />
          <BodyText size="xs" muted>
            {draft.source}
          </BodyText>
        </Box>
        {draft.conditioning_summary ? (
          <BodyText size="xs" muted>
            {draft.conditioning_summary}
          </BodyText>
        ) : null}
        <Box className="grid gap-3 md:grid-cols-2">
          {(draft.variants ?? []).map((v) => (
            <Box
              key={v.key}
              className="border-border bg-background flex flex-col gap-2 rounded-lg border p-4"
              data-testid={`campaign-learning-draft-${v.key}`}
            >
              <Box className="flex flex-wrap items-center gap-2">
                <BodyText size="sm" className="font-semibold">
                  Variant {v.key}
                </BodyText>
                {v.include_meet_link ? (
                  <StatusBadge text="Meet CTA" variant="info" size="xs" />
                ) : null}
              </Box>
              <BodyText size="sm" className="font-medium">
                {v.subject}
              </BodyText>
              <BodyText size="xs" muted className="line-clamp-4 whitespace-pre-wrap">
                {v.body_template}
              </BodyText>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export function CampaignLearningPanel() {
  const brokerageOrgId = useResolvedBrokerageOrgId();
  const listQuery = useCampaignList(brokerageOrgId);
  const campaigns = useMemo(() => listQuery.data?.campaigns ?? [], [listQuery.data?.campaigns]);
  const [campaignId, setCampaignId] = useState("");

  useEffect(() => {
    if (!campaignId && campaigns.length > 0) {
      const preferred =
        campaigns.find((c) => (c.name || "").includes("Title attach")) ?? campaigns[0];
      setCampaignId(preferred.id);
    }
  }, [campaigns, campaignId]);

  const resultsQuery = useCampaignResults(campaignId, brokerageOrgId);
  const learningQuery = useCampaignLearning(campaignId, brokerageOrgId);
  const runLoop = useRunCampaignLearningLoop(campaignId, brokerageOrgId);

  const results = resultsQuery.data;
  // Mutation data is not keyed by campaignId — ignore stale A after switching to B.
  const mutationLearning = runLoop.data?.campaign_id === campaignId ? runLoop.data : undefined;
  const learning =
    mutationLearning ??
    (learningQuery.data && "winner_analysis" in learningQuery.data
      ? learningQuery.data
      : results?.learning && "winner_analysis" in results.learning
        ? results.learning
        : null);

  const campaignOptions = useMemo(
    () => campaigns.map((c) => ({ value: c.id, label: c.name })),
    [campaigns]
  );

  const funnelBars = useMemo(() => {
    const funnel = results?.funnel_by_variant;
    if (!funnel) return [];
    const bars: Array<{ label: string; value: number }> = [];
    for (const key of ["A", "B"] as const) {
      const f = funnel[key];
      if (!f || !f.sent) continue;
      bars.push({ label: `${key} open`, value: Math.round((100 * f.opened) / f.sent) });
      bars.push({ label: `${key} click`, value: Math.round((100 * f.clicked) / f.sent) });
      bars.push({ label: `${key} attach`, value: Math.round((100 * f.attached) / f.sent) });
    }
    return bars;
  }, [results]);

  const chartColor = color("chart.1");
  const successColor = color("state.success.DEFAULT");
  const winner = results?.variants?.find((v) => v.is_winner)?.variant_key;
  const hasLearning = Boolean(learning && "winner_analysis" in learning);

  return (
    <Box
      id="learning-loop"
      className="border-border bg-background-surface flex min-w-0 scroll-mt-24 flex-col gap-4 rounded-xl border p-5 shadow-sm"
      data-testid="campaign-learning-panel"
    >
      <Box className="flex flex-wrap items-start justify-between gap-3">
        <Box className="flex min-w-0 flex-col gap-1">
          <Box className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <Title size="md" as="h2">
              Learning loop
            </Title>
            <StatusBadge text="Approval required" variant="warning" size="xs" />
          </Box>
          <BodyText size="xs" muted>
            Model picks the winning A/B variant, reviews what moved attach rate, and drafts the next
            pair — never auto-sent.
          </BodyText>
        </Box>
      </Box>

      <Box className="flex flex-wrap items-end gap-3">
        <Box className="w-full max-w-sm flex-1">
          <Select
            id="campaign-learning-select"
            label="Seeded campaign"
            size="sm"
            options={
              campaignOptions.length
                ? campaignOptions
                : [{ value: "", label: listQuery.isLoading ? "Loading…" : "No seeded campaigns" }]
            }
            value={campaignId}
            onChange={setCampaignId}
            disabled={!campaignOptions.length}
          />
        </Box>

        <Button
          variant="primary"
          size="sm"
          label="Run learning loop"
          disabled={!campaignId || runLoop.isPending}
          onPress={() => runLoop.mutate({ skipPerplexity: false })}
        >
          {runLoop.isPending ? "Running…" : "Run learning loop"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          label="Run offline fallback"
          disabled={!campaignId || runLoop.isPending}
          onPress={() => runLoop.mutate({ skipPerplexity: true })}
        >
          Offline fallback
        </Button>
      </Box>

      {listQuery.isError || runLoop.isError ? (
        <BodyText size="sm" className="text-state-danger" role="alert">
          {runLoop.isError
            ? "Learning loop failed — try Offline fallback (cached draft)."
            : "Could not load campaigns — seed demo campaigns and ensure API auth."}
        </BodyText>
      ) : null}

      {results?.success ? (
        <Box className="flex flex-col gap-3" data-testid="campaign-learning-results">
          <Box className="grid gap-3 sm:grid-cols-3">
            <KpiCard
              label="Campaign"
              value={results.name ?? "Results"}
              delta={winner ? `Winner: Variant ${winner}` : undefined}
              deltaTone={winner ? "up" : undefined}
              iconName="mail"
              valueColor={winner ? successColor : undefined}
            />
            <KpiCard
              label="Attach lift"
              value={
                results.attach_rate_lift_pp != null
                  ? `+${formatLiftPp(results.attach_rate_lift_pp)} pp`
                  : "—"
              }
              deltaTone={results.attach_rate_lift_pp != null ? "up" : undefined}
              iconName="trending-up"
            />
            <KpiCard
              label="Recovered"
              value={
                results.recovered_dollars_total != null
                  ? formatAncillaryDollars(results.recovered_dollars_total)
                  : "—"
              }
              deltaTone={results.recovered_dollars_total != null ? "up" : undefined}
              iconName="key"
              valueColor={color("gold.DEFAULT")}
            />
          </Box>
          {funnelBars.length > 0 ? (
            <Box data-testid="campaign-learning-funnel-chart">
              <BodyText size="xs" muted className="mb-2">
                Funnel rates by variant
              </BodyText>
              <AnalyticsBarChart
                data={funnelBars}
                orientation="vertical"
                color={chartColor}
                height={200}
                unit="%"
              />
            </Box>
          ) : null}
        </Box>
      ) : null}

      {hasLearning && learning ? (
        <LearningOutput result={learning} />
      ) : (
        <BodyText size="sm" muted data-testid="campaign-learning-empty">
          Run the learning loop for winner analysis, what worked, and a drafted next-iteration pair.
        </BodyText>
      )}
    </Box>
  );
}
