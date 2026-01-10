import React from "react";
import { DollarSign, Target, XCircle, Clock } from "lucide-react";
import SectionCard from "../../../components/layout/SectionCard";
import type { ClientGoals } from "../../../../../packages/schemas/agent";

type GoalsConstraintsProps = {
  goals: ClientGoals;
};

const GoalsConstraints: React.FC<GoalsConstraintsProps> = ({ goals }) => {
  const formatCurrency = (amount?: number) => {
    if (!amount) return "Not set";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const urgencyColors = {
    low: "text-olive bg-olive/10",
    medium: "text-gold bg-gold/10",
    high: "text-rose-600 bg-rose-50",
  };

  return (
    <SectionCard title="Goals & Constraints" icon={Target}>
      <div className="space-y-6">
        {/* Budget */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-5 w-5 text-olive" />
            <h3 className="text-responsive-base font-semibold text-navy">
              Budget
            </h3>
          </div>
          <div className="space-y-2 pl-7">
            <div className="flex items-center justify-between">
              <span className="text-responsive-sm text-black/60">Hard Max:</span>
              <span className="text-responsive-sm font-medium text-black">
                {formatCurrency(goals.budget_max)}
              </span>
            </div>
            {goals.budget_stretch && (
              <div className="flex items-center justify-between">
                <span className="text-responsive-sm text-black/60">
                  Stretch Budget:
                </span>
                <span className="text-responsive-sm font-medium text-black">
                  {formatCurrency(goals.budget_stretch)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-responsive-sm text-black/60">Minimum:</span>
              <span className="text-responsive-sm font-medium text-black">
                {formatCurrency(goals.budget_min)}
              </span>
            </div>
          </div>
        </div>

        {/* Must-Haves */}
        {goals.must_haves.length > 0 && (
          <div>
            <h3 className="text-responsive-base font-semibold text-navy mb-3">
              Must-Haves
            </h3>
            <ul className="space-y-2">
              {goals.must_haves.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-responsive-sm text-black"
                >
                  <Target className="h-4 w-4 text-olive flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Deal Breakers */}
        {goals.deal_breakers.length > 0 && (
          <div>
            <h3 className="text-responsive-base font-semibold text-navy mb-3 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-600" />
              Deal Breakers
            </h3>
            <ul className="space-y-2">
              {goals.deal_breakers.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-responsive-sm text-black"
                >
                  <XCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Timeline Urgency */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-gold" />
            <h3 className="text-responsive-base font-semibold text-navy">
              Timeline Urgency
            </h3>
          </div>
          <div
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${urgencyColors[goals.timeline_urgency]}`}
          >
            <span className="text-responsive-sm font-medium capitalize">
              {goals.timeline_urgency}
            </span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

export default GoalsConstraints;
