/**
 * CampaignLearningPanel — SIL-309
 *
 * One-click learning loop on the Campaigns page (SIL-306/307):
 * winner analysis → what-worked review → drafted next A/B pair (approval required).
 */
import { useEffect, useMemo, useState } from "react";

import { color } from "packages/design-tokens";
import { AnalyticsBarChart } from "packages/features/brokerage/components/charts";
import {
  useCampaignLearning,
  useCampaignList,
  useCampaignResults,
  useResolvedBrokerageOrgId,
  useRunCampaignLearningLoop,
} from "packages/features/brokerage/hooks/useCampaignLearning";
import type { CampaignLearningResult } from "packages/features/brokerage/types/campaignLearning";
import Button from "packages/ui/components/actions/button/Button";
import Select from "packages/ui/components/inputs/form/pickers/Select";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

function formatPctRate(rate: number | undefined): string {
  if (rate == null) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

function LearningOutput({ result }: { result: CampaignLearningResult }) {
  const winner = result.winner_analysis;
  const draft = result.next_iteration_draft;
  const successColor = color("state.success.DEFAULT");

  return (
    <Box className="flex flex-col gap-4">
      <Box className="border-border rounded-lg border p-4">
        <Title size="sm" as="h4" className="mb-2">
          Winner analysis
        </Title>
        <BodyText size="sm">
          Variant{" "}
          <BodyText as="span" size="sm" className="font-semibold" style={{ color: successColor }}>
            {winner.winner_variant}
          </BodyText>
          {" · "}
          attach {formatPctRate(winner.winner_attach_rate)}
          {" · "}
          model {winner.model?.chosen_model ?? "—"}
          {winner.model?.chosen_auc != null ? ` (AUC ${winner.model.chosen_auc})` : ""}
        </BodyText>
        <Box className="mt-2 flex flex-col gap-1">
          {(winner.drivers ?? []).map((d) => (
            <BodyText key={d} size="xs" muted>
              • {d}
            </BodyText>
          ))}
        </Box>
        {winner.model?.rationale ? (
          <BodyText size="xs" muted className="mt-2">
            {winner.model.rationale}
          </BodyText>
        ) : null}
      </Box>

      <Box className="border-border rounded-lg border p-4">
        <Title size="sm" as="h4" className="mb-2">
          What worked / what didn&apos;t
        </Title>
        <BodyText size="xs" muted className="mb-1">
          Source: {result.review.source}
        </BodyText>
        <BodyText size="sm" className="mb-1">
          Worked
        </BodyText>
        {(result.review.what_worked ?? []).map((item) => (
          <BodyText key={item} size="xs" muted>
            • {item}
          </BodyText>
        ))}
        <BodyText size="sm" className="mb-1 mt-3">
          Did not work
        </BodyText>
        {(result.review.what_did_not_work ?? []).map((item) => (
          <BodyText key={item} size="xs" muted>
            • {item}
          </BodyText>
        ))}
        {result.review.recommended_next_test ? (
          <BodyText size="xs" className="mt-3">
            Next test: {result.review.recommended_next_test}
          </BodyText>
        ) : null}
      </Box>

      <Box className="border-border rounded-lg border p-4">
        <Title size="sm" as="h4" className="mb-1">
          Next-iteration draft (approval required)
        </Title>
        <BodyText size="xs" muted className="mb-3">
          Status: {draft.status} · source: {draft.source} · never auto-sent
        </BodyText>
        <Box className="grid gap-3 md:grid-cols-2">
          {(draft.variants ?? []).map((v) => (
            <Box key={v.key} className="border-border rounded-lg border p-3">
              <BodyText size="xs" muted>
                Variant {v.key}
                {v.include_meet_link ? " · Meet CTA" : ""}
              </BodyText>
              <BodyText size="sm" className="mt-1 font-medium">
                {v.subject}
              </BodyText>
              <BodyText size="xs" muted className="mt-2">
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
  const learning =
    (runLoop.data as CampaignLearningResult | undefined) ??
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

  const successColor = color("state.success.DEFAULT");
  const chartColor = color("chart.1");
  const winner = results?.variants?.find((v) => v.is_winner)?.variant_key;

  return (
    <Box className="flex flex-col gap-5" data-testid="campaign-learning-panel">
      <Box className="border-border-warning bg-background-warning rounded-lg border px-3 py-2">
        <BodyText size="xs" muted>
          Demo learning loop — model picks winners, Perplexity reviews + drafts next A/B. Drafts
          require human approval. No PII in prompts.
        </BodyText>
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
        <BodyText size="sm" className="text-state-danger">
          {runLoop.isError
            ? "Learning loop failed — try Offline fallback (cached draft)."
            : "Could not load campaigns — seed with seed_demo_campaigns and ensure API auth."}
        </BodyText>
      ) : null}

      {results?.success ? (
        <Box className="border-border bg-background-surface rounded-xl border p-5">
          <Box className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <Title size="sm" as="h3">
              {results.name ?? "Campaign results"}
            </Title>
            <BodyText size="sm">
              {winner ? (
                <>
                  Winner:{" "}
                  <BodyText
                    as="span"
                    size="sm"
                    className="font-semibold"
                    style={{ color: successColor }}
                  >
                    Variant {winner}
                  </BodyText>
                </>
              ) : null}
              {results.attach_rate_lift_pp != null
                ? ` · lift ${results.attach_rate_lift_pp}pp`
                : ""}
              {results.recovered_dollars_total != null
                ? ` · recovered $${results.recovered_dollars_total.toLocaleString()}`
                : ""}
            </BodyText>
          </Box>
          {funnelBars.length > 0 ? (
            <AnalyticsBarChart
              data={funnelBars}
              orientation="vertical"
              color={chartColor}
              height={220}
              unit="%"
            />
          ) : null}
        </Box>
      ) : null}

      {learning && "winner_analysis" in learning ? (
        <LearningOutput result={learning} />
      ) : (
        <BodyText size="sm" muted>
          Click &quot;Run learning loop&quot; for winner analysis, what-worked summary, and a
          drafted next-iteration variant pair.
        </BodyText>
      )}
    </Box>
  );
}
