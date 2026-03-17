import React from "react";

import { Icon } from "@ui/icons";

import type { RiskFlag as RiskFlagType } from "packages/schemas/agent";
import SectionCard from "packages/ui/components/cards/SectionCard";

import { BodyText, Title } from "@/components/ui";
import RiskFlag from "@/features/dashboard/components/RiskFlag";
type RiskWatchlistProps = {
  riskFlags: RiskFlagType[];
  emotionalVolatility?: "low" | "medium" | "high";
};
const RiskWatchlist: React.FC<RiskWatchlistProps> = ({
  riskFlags,
  emotionalVolatility = "low",
}) => {
  const volatilityColors = {
    low: "text-primary bg-primary-muted",
    medium: "text-accent bg-accent-muted",
    high: "text-destructive bg-primary-muted",
  };
  const riskCategories: Record<
    RiskFlagType["type"],
    {
      label: string;
      icon: React.ReactNode;
    }
  > = {
    financing: {
      label: "Financing",
      icon: <Icon name="trending-down" className="h-4 w-4" />,
    },
    timeline: {
      label: "Timeline",
      icon: <Icon name="alert-triangle" className="h-4 w-4" />,
    },
    inspection: { label: "Inspection", icon: <Icon name="home" className="h-4 w-4" /> },
    emotions: { label: "Emotions", icon: <Icon name="heart" className="h-4 w-4" /> },
    hoa: { label: "HOA", icon: <Icon name="home" className="h-4 w-4" /> },
    resale: { label: "Resale", icon: <Icon name="trending-down" className="h-4 w-4" /> },
    appraisal: {
      label: "Appraisal",
      icon: <Icon name="alert-triangle" className="h-4 w-4" />,
    },
    other: { label: "Other", icon: <Icon name="alert-triangle" className="h-4 w-4" /> },
  };
  return (
    <SectionCard title="Risk & Watchlist" iconName="alert-triangle">
      <div className="space-y-6">
        {/* Risk Flags */}
        <div>
          <Title as="h3" size="md" className="text-text-primary mb-4 font-semibold">
            Risk Flags
          </Title>
          {riskFlags.length === 0 ? (
            <div className="py-8 text-center">
              <BodyText as="p" size="sm" className="text-text-secondary">
                No risk flags identified
              </BodyText>
            </div>
          ) : (
            <div className="space-y-3">
              {riskFlags.map((flag, index) => {
                const category = riskCategories[flag.type];
                return (
                  <div
                    key={index}
                    className="border-border bg-background-surface flex items-start gap-3 rounded-lg border p-4"
                  >
                    <div className="mt-1 flex-shrink-0">{category.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <BodyText as="span" size="sm" className="text-text-primary font-medium">
                          {category.label}
                        </BodyText>
                        <RiskFlag severity={flag.severity} message={flag.message} />
                      </div>
                      <BodyText as="p" size="sm" className="text-text-secondary">
                        {flag.message}
                      </BodyText>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Emotional Volatility Indicator */}
        <div>
          <Title
            as="h3"
            size="md"
            className="text-text-primary mb-3 flex items-center gap-2 font-semibold"
          >
            <Icon name="heart" className="text-destructive h-5 w-5" />
            Emotional Volatility
          </Title>
          <div
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 ${volatilityColors[emotionalVolatility]}`}
          >
            <BodyText as="span" size="sm" className="font-medium capitalize">
              {emotionalVolatility}
            </BodyText>
          </div>
          <BodyText as="p" size="xs" className="text-text-secondary mt-2">
            Client's emotional state and decision-making stability
          </BodyText>
        </div>
      </div>
    </SectionCard>
  );
};
export default RiskWatchlist;
