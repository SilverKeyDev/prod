import { color } from "packages/design-tokens";
import { SectionCard } from "packages/features/brokerage/components/analytics/AnalyticsShellShared";
import type { AgentDetailView } from "packages/features/brokerage/utils/analytics/agentDetailTransforms";
import {
  rankFlightRiskFactorsWithSubs,
  type RiskScoreBand,
  riskScoreBand,
} from "packages/features/brokerage/utils/analytics/flightRiskFactors";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

interface Props {
  retentionAgent: AgentDetailView["retentionAgent"];
  engagementAgent: AgentDetailView["engagementAgent"];
}

function bandColor(
  band: RiskScoreBand,
  colors: { danger: string; warning: string; success: string }
): string {
  if (band === "high") return colors.danger;
  if (band === "medium") return colors.warning;
  return colors.success;
}

export function AgentDetailRetention({ retentionAgent, engagementAgent }: Props) {
  const dangerColor = color("state.danger.DEFAULT");
  const warningColor = color("state.warning.DEFAULT");
  const successColor = color("state.success.DEFAULT");
  const bandColors = {
    danger: dangerColor,
    warning: warningColor,
    success: successColor,
  };

  if (!retentionAgent && !engagementAgent) {
    return (
      <SectionCard title="Retention & Coaching" iconName="user-check">
        <BodyText size="sm" muted>
          No retention risk data available for this agent.
        </BodyText>
      </SectionCard>
    );
  }

  const factorRows = retentionAgent
    ? rankFlightRiskFactorsWithSubs(retentionAgent.agent_id, retentionAgent.factor_scores)
    : [];

  return (
    <SectionCard title="Retention & Coaching" iconName="user-check">
      {retentionAgent && (
        <Box className="mb-6">
          <Title size="sm" as="h4" className="mb-4">
            Retention Risk Assessment
          </Title>
          <Box className="mb-4 rounded-lg bg-gray-50 p-4">
            <BodyText size="xs" muted>
              Blended risk score
            </BodyText>
            <Title
              size="md"
              style={{
                color: bandColor(riskScoreBand(retentionAgent.risk_score), bandColors),
              }}
            >
              {retentionAgent.risk_score}
            </Title>
          </Box>
          <Box className="flex flex-col gap-3">
            {factorRows.map((factor) => {
              const factorColor = bandColor(riskScoreBand(factor.score), bandColors);
              return (
                <Box key={factor.key} className="rounded-lg bg-gray-50 px-4 py-3">
                  <Box className="flex items-center justify-between">
                    <BodyText size="sm" className="font-medium">
                      {factor.label}
                    </BodyText>
                    <BodyText
                      size="sm"
                      className="font-semibold tabular-nums"
                      style={{ color: factorColor }}
                    >
                      {factor.score}
                    </BodyText>
                  </Box>
                  {factor.subfactors && factor.subfactors.length > 0 ? (
                    <Box className="mt-2 flex flex-col gap-1.5 border-t border-gray-200/80 pl-3 pt-2">
                      {factor.subfactors.map((sub) => (
                        <Box key={sub.label} className="flex items-center justify-between gap-3">
                          <BodyText size="xs" muted>
                            {sub.label}
                          </BodyText>
                          <BodyText
                            size="xs"
                            className="shrink-0 font-semibold tabular-nums"
                            style={{
                              color: bandColor(riskScoreBand(sub.score), bandColors),
                            }}
                          >
                            {sub.score}
                          </BodyText>
                        </Box>
                      ))}
                    </Box>
                  ) : null}
                </Box>
              );
            })}
          </Box>
          <BodyText size="xs" muted className="mt-3">
            Comp competitiveness uses split vs market ({retentionAgent.current_split_percent}% vs{" "}
            {retentionAgent.market_benchmark_split_percent}%) as one model input.
          </BodyText>
          <BodyText size="xs" muted className="mt-2 italic">
            {retentionAgent.recommended_action}
          </BodyText>
        </Box>
      )}

      {engagementAgent && (
        <Box>
          <Title size="sm" as="h4" className="mb-3">
            Targeted Engagement
          </Title>
          <Box className="rounded-lg bg-gray-50 p-4">
            <Box className="mb-2 flex items-center justify-between">
              <BodyText size="sm" className="font-medium">
                Priority: {engagementAgent.priority}
              </BodyText>
              <BodyText size="xs" muted>
                {engagementAgent.quartile} quartile
              </BodyText>
            </Box>
            <BodyText size="sm" className="mb-3">
              {engagementAgent.suggested_action}
            </BodyText>
            {engagementAgent.service_gaps.length > 0 && (
              <Box>
                <BodyText size="xs" muted className="mb-1">
                  Service gaps:
                </BodyText>
                <Box className="flex gap-2">
                  {engagementAgent.service_gaps.map((gap) => (
                    <Box
                      key={gap}
                      className="rounded px-2 py-1 text-xs"
                      style={{
                        backgroundColor: color("background.muted"),
                        color: color("text.muted"),
                      }}
                    >
                      {gap.replace("_", " ")}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </SectionCard>
  );
}
