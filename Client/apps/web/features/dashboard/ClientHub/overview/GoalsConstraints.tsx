import React from "react";

import { Clock, DollarSign, Target, XCircle } from "lucide-react";

import type { ClientGoals } from "packages/schemas/agent";

import SectionCard from "@/components/layout/SectionCard";
import { BodyText, Title } from "@/components/ui/index.web";

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
            <Title as="h3" size="md" className="font-semibold text-navy">
              Budget
            </Title>
          </div>
          <div className="space-y-2 pl-7">
            <div className="flex items-center justify-between">
              <BodyText as="span" size="sm" className="text-black/60">
                Hard Max:
              </BodyText>
              <BodyText as="span" size="sm" className="font-medium text-black">
                {formatCurrency(goals.budget_max)}
              </BodyText>
            </div>
            {goals.budget_stretch && (
              <div className="flex items-center justify-between">
                <BodyText as="span" size="sm" className="text-black/60">
                  Stretch Budget:
                </BodyText>
                <BodyText
                  as="span"
                  size="sm"
                  className="font-medium text-black"
                >
                  {formatCurrency(goals.budget_stretch)}
                </BodyText>
              </div>
            )}
            <div className="flex items-center justify-between">
              <BodyText as="span" size="sm" className="text-black/60">
                Minimum:
              </BodyText>
              <BodyText as="span" size="sm" className="font-medium text-black">
                {formatCurrency(goals.budget_min)}
              </BodyText>
            </div>
          </div>
        </div>

        {/* Must-Haves */}
        {goals.must_haves.length > 0 && (
          <div>
            <Title as="h3" size="md" className="font-semibold text-navy mb-3">
              Must-Haves
            </Title>
            <ul className="space-y-2">
              {goals.must_haves.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-responsive-sm text-black"
                >
                  <Target className="h-4 w-4 text-olive flex-shrink-0" />
                  <BodyText as="span" size="sm" className="text-black">
                    {item}
                  </BodyText>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Deal Breakers */}
        {goals.deal_breakers.length > 0 && (
          <div>
            <Title
              as="h3"
              size="md"
              className="font-semibold text-navy mb-3 flex items-center gap-2"
            >
              <XCircle className="h-5 w-5 text-rose-600" />
              Deal Breakers
            </Title>
            <ul className="space-y-2">
              {goals.deal_breakers.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-responsive-sm text-black"
                >
                  <XCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                  <BodyText as="span" size="sm" className="text-black">
                    {item}
                  </BodyText>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Timeline Urgency */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-gold" />
            <Title as="h3" size="md" className="font-semibold text-navy">
              Timeline Urgency
            </Title>
          </div>
          <div
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${urgencyColors[goals.timeline_urgency]}`}
          >
            <BodyText as="span" size="sm" className="font-medium capitalize">
              {goals.timeline_urgency}
            </BodyText>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

export default GoalsConstraints;
