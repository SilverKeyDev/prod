import React from "react";

import { Icon } from "@ui/icons";
import { Target } from "lucide-react";

import type { ClientGoals } from "packages/schemas/agent";
import SectionCard from "packages/ui/components/cards/SectionCard";
import { BodyText, Title } from "packages/ui/components/index.web";
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
          <div className="mb-3 flex items-center gap-2">
            <Icon name="dollar-sign" className="text-olive h-5 w-5" />
            <Title as="h3" size="md" className="text-navy font-semibold">
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
                <BodyText as="span" size="sm" className="font-medium text-black">
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
            <Title as="h3" size="md" className="text-navy mb-3 font-semibold">
              Must-Haves
            </Title>
            <ul className="space-y-2">
              {goals.must_haves.map((item, index) => (
                <li key={index} className="text-responsive-sm flex items-center gap-2 text-black">
                  <Icon name="target" className="text-olive h-4 w-4 flex-shrink-0" />
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
              className="text-navy mb-3 flex items-center gap-2 font-semibold"
            >
              <Icon name="x-circle" className="h-5 w-5 text-rose-600" />
              Deal Breakers
            </Title>
            <ul className="space-y-2">
              {goals.deal_breakers.map((item, index) => (
                <li key={index} className="text-responsive-sm flex items-center gap-2 text-black">
                  <Icon name="x-circle" className="h-4 w-4 flex-shrink-0 text-rose-600" />
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
          <div className="mb-3 flex items-center gap-2">
            <Icon name="clock" className="text-gold h-5 w-5" />
            <Title as="h3" size="md" className="text-navy font-semibold">
              Timeline Urgency
            </Title>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 ${urgencyColors[goals.timeline_urgency]}`}
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
