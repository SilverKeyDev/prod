/**
 * AncillaryInsightPanel — SIL-277
 *
 * Primary sales document for the SkySlope engagement.
 * Shows exact attach rates and dollar leakage for title, lending,
 * escrow, and home warranty by agent and office.
 *
 * Background: Large brokerages set up joint ventures (JVs) with ancillary
 * service providers (title companies, lenders, escrow companies, home warranty).
 * When agents use outside vendors instead of the brokerage's in-house JV partners,
 * the brokerage loses that referral revenue. This panel quantifies that leakage.
 *
 * Attach rate = % of transactions that used in-house provider.
 * Leakage $ = transactions using outside vendor × estimated fee per service.
 *
 * TODO SIL-272: Numbers become real once SkySlope sync lands.
 * TODO SIL-211: Reuse this panel in brokerage performance dashboard.
 */
import { useMemo } from "react";

import { useAncillaryAnalytics } from "packages/features/brokerage/hooks/useAncillaryAnalytics";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

const SERVICE_LABELS: Record<string, string> = {
  title: "Title Insurance",
  lending: "Lending / Mortgage",
  escrow: "Escrow",
  home_warranty: "Home Warranty",
  mortgage_insurance: "Mortgage Insurance",
};

const SERVICE_COLORS: Record<string, string> = {
  title: "#22c55e",
  lending: "#ef4444",
  escrow: "#f59e0b",
  home_warranty: "#3b82f6",
  mortgage_insurance: "#8b5cf6",
};

function formatDollars(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

function AttachRateBar({ rate, service }: { rate: number; service: string }) {
  const color = SERVICE_COLORS[service] ?? "#6b7280";
  const leakagePercent = 100 - rate;
  return (
    <Box className="w-full">
      <Box className="mb-1 flex justify-between">
        <BodyText size="xs" muted>
          In-house {rate.toFixed(1)}%
        </BodyText>
        <BodyText size="xs" className="text-red-500">
          Outside {leakagePercent.toFixed(1)}%
        </BodyText>
      </Box>
      <Box className="bg-background-muted h-2 w-full overflow-hidden rounded-full">
        <Box
          className="h-2 rounded-full"
          style={{ width: `${rate}%`, backgroundColor: color }}
        />
      </Box>
    </Box>
  );
}

/** Synthetic data disclaimer shown on all demo data. */
function DemoDisclaimer() {
  return (
    <Box className="border-border-warning bg-background-warning rounded-lg border px-3 py-2">
      <BodyText size="xs" muted>
        ⚠️ Demo data — synthetic figures only. Real numbers populate once SkySlope sync completes.
      </BodyText>
    </Box>
  );
}

export function AncillaryInsightPanel() {
  const { data, isLoading } = useAncillaryAnalytics();

  const sortedAgents = useMemo(
    () =>
      [...(data?.by_agent ?? [])].sort(
        (a, b) => b.total_leakage_dollars - a.total_leakage_dollars
      ),
    [data]
  );

  if (isLoading) {
    return (
      <Box className="p-6">
        <BodyText muted>Loading ancillary data…</BodyText>
      </Box>
    );
  }

  if (!data) return null;

  return (
    <Box className="flex flex-col gap-6">
      <DemoDisclaimer />

      {/* Headline leakage number — the pitch hook */}
      <Box className="border-border-danger bg-background-surface rounded-xl border p-6">
        <BodyText size="sm" muted className="mb-1">
          Estimated Annual Revenue Leakage
        </BodyText>
        <Title size="xl" className="text-red-500">
          {formatDollars(data.summary.total_leakage_dollars)}
        </Title>
        <BodyText size="sm" muted className="mt-2">
          Across {data.total_transactions} transactions —{" "}
          {data.summary.avg_attach_rate_percent.toFixed(1)}% average in-house attach rate
        </BodyText>
        <BodyText size="xs" muted className="mt-1">
          Based on configurable fee assumptions per service category
        </BodyText>
      </Box>

      {/* Attach rates by service */}
      <Box className="border-border bg-background-surface rounded-xl border p-5">
        <Title size="sm" as="h3" className="mb-4">
          Attach Rates by Service
        </Title>
        <Box className="flex flex-col gap-5">
          {data.by_service.map((svc) => (
            <Box key={svc.service}>
              <Box className="mb-2 flex items-center justify-between">
                <BodyText size="sm" className="font-medium">
                  {SERVICE_LABELS[svc.service] ?? svc.service}
                </BodyText>
                <Box className="flex gap-4">
                  <BodyText size="xs" muted>
                    {svc.in_house_count} in-house / {svc.outside_count} outside
                  </BodyText>
                  <BodyText size="xs" className="text-red-500 font-medium">
                    {formatDollars(svc.leakage_dollars)} leaked
                  </BodyText>
                </Box>
              </Box>
              <AttachRateBar rate={svc.attach_rate_percent} service={svc.service} />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Agent leakage leaderboard */}
      <Box className="border-border bg-background-surface rounded-xl border p-5">
        <Title size="sm" as="h3" className="mb-1">
          Agent Leakage Leaderboard
        </Title>
        <BodyText size="xs" muted className="mb-4">
          Agents sorted by total estimated leakage — highest opportunity for coaching
        </BodyText>
        <Box className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-border border-b">
                <th className="py-2 pr-4 font-medium">Agent</th>
                <th className="py-2 pr-4 font-medium">Transactions</th>
                <th className="py-2 pr-4 font-medium">Title Attach</th>
                <th className="py-2 pr-4 font-medium">Lending Attach</th>
                <th className="py-2 font-medium text-red-500">Total Leakage</th>
              </tr>
            </thead>
            <tbody>
              {sortedAgents.map((agent, index) => (
                <tr key={agent.agent_id} className="border-border/60 border-b">
                  <td className="py-2 pr-4">
                    <Box className="flex items-center gap-2">
                      {index === 0 && (
                        <span className="text-red-500 text-xs font-bold">▲</span>
                      )}
                      <span className="font-medium">{agent.name}</span>
                    </Box>
                  </td>
                  <td className="py-2 pr-4">{agent.transactions}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        agent.title_attach >= 60
                          ? "text-green-600"
                          : agent.title_attach >= 40
                            ? "text-yellow-600"
                            : "text-red-500"
                      }
                    >
                      {agent.title_attach.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        agent.lending_attach >= 60
                          ? "text-green-600"
                          : agent.lending_attach >= 40
                            ? "text-yellow-600"
                            : "text-red-500"
                      }
                    >
                      {agent.lending_attach.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2 font-bold text-red-500">
                    {formatDollars(agent.total_leakage_dollars)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Box>

      {/* Export note */}
      <Box className="border-border rounded-xl border border-dashed p-4 text-center">
        <BodyText size="sm" muted>
          📋 Export functionality coming in SIL-277 v2 — screenshot this view for pitch decks
        </BodyText>
      </Box>
    </Box>
  );
}