import React from "react";

import { AlertTriangle, Heart, Home, TrendingDown } from "lucide-react";

import type { RiskFlag as RiskFlagType } from "packages/schemas/agent";

import SectionCard from "@/components/layout/SectionCard";
import { BodyText, Title } from "@/components/ui/index.web";
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
    low: "text-olive bg-olive/10",
    medium: "text-gold bg-gold/10",
    high: "text-rose-600 bg-rose-50",
  };

  const riskCategories: Record<
    RiskFlagType["type"],
    { label: string; icon: React.ReactNode }
  > = {
    financing: {
      label: "Financing",
      icon: <TrendingDown className="h-4 w-4" />,
    },
    timeline: {
      label: "Timeline",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    inspection: { label: "Inspection", icon: <Home className="h-4 w-4" /> },
    emotions: { label: "Emotions", icon: <Heart className="h-4 w-4" /> },
    hoa: { label: "HOA", icon: <Home className="h-4 w-4" /> },
    resale: { label: "Resale", icon: <TrendingDown className="h-4 w-4" /> },
    appraisal: {
      label: "Appraisal",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    other: { label: "Other", icon: <AlertTriangle className="h-4 w-4" /> },
  };

  return (
    <SectionCard title="Risk & Watchlist" icon={AlertTriangle}>
      <div className="space-y-6">
        {/* Risk Flags */}
        <div>
          <Title as="h3" size="md" className="font-semibold text-navy mb-4">
            Risk Flags
          </Title>
          {riskFlags.length === 0 ? (
            <div className="text-center py-8">
              <BodyText as="p" size="sm" className="text-black/60">
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
                    className="flex items-start gap-3 p-4 rounded-lg border border-beige/30 bg-white"
                  >
                    <div className="flex-shrink-0 mt-1">{category.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <BodyText
                          as="span"
                          size="sm"
                          className="font-medium text-navy"
                        >
                          {category.label}
                        </BodyText>
                        <RiskFlag
                          severity={flag.severity}
                          message={flag.message}
                        />
                      </div>
                      <BodyText as="p" size="sm" className="text-black/60">
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
            className="font-semibold text-navy mb-3 flex items-center gap-2"
          >
            <Heart className="h-5 w-5 text-rose-600" />
            Emotional Volatility
          </Title>
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${volatilityColors[emotionalVolatility]}`}
          >
            <BodyText as="span" size="sm" className="font-medium capitalize">
              {emotionalVolatility}
            </BodyText>
          </div>
          <BodyText as="p" size="xs" className="text-black/60 mt-2">
            Client's emotional state and decision-making stability
          </BodyText>
        </div>
      </div>
    </SectionCard>
  );
};

export default RiskWatchlist;
