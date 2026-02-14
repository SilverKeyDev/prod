import React from "react";
import { AlertTriangle, Home, TrendingDown, Heart } from "lucide-react";
import SectionCard from "../../../components/layout/SectionCard";
import RiskFlag from "../components/RiskFlag";
import type { RiskFlag as RiskFlagType } from "../../../../../packages/schemas/agent";

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
          <h3 className="text-responsive-base font-semibold text-navy mb-4">
            Risk Flags
          </h3>
          {riskFlags.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-responsive-sm text-black/60">
                No risk flags identified
              </p>
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
                        <span className="text-responsive-sm font-medium text-navy">
                          {category.label}
                        </span>
                        <RiskFlag
                          severity={flag.severity}
                          message={flag.message}
                        />
                      </div>
                      <p className="text-responsive-sm text-black/60">
                        {flag.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Emotional Volatility Indicator */}
        <div>
          <h3 className="text-responsive-base font-semibold text-navy mb-3 flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-600" />
            Emotional Volatility
          </h3>
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${volatilityColors[emotionalVolatility]}`}
          >
            <span className="text-responsive-sm font-medium capitalize">
              {emotionalVolatility}
            </span>
          </div>
          <p className="text-xs text-black/60 mt-2">
            Client's emotional state and decision-making stability
          </p>
        </div>
      </div>
    </SectionCard>
  );
};

export default RiskWatchlist;
