import React from "react";

import { Icon } from "@ui/icons";

import type { ClientGoals } from "packages/schemas/agent";
import SectionCard from "packages/ui/components/cards/SectionCard";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Title } from "@/components/ui";
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
    low: "text-primary bg-primary-muted",
    medium: "text-accent bg-accent-muted",
    high: "text-destructive bg-primary-muted",
  };
  return (
    <SectionCard title="Goals & Constraints" iconName="target">
      <Box className="space-y-6">
        {/* Budget */}
        <Box>
          <Box className="mb-3 flex items-center gap-2">
            <Icon name="dollar-sign" className="text-primary h-5 w-5" />
            <Title as="h3" size="md" className="text-text-primary font-semibold">
              Budget
            </Title>
          </Box>
          <Box className="space-y-2 pl-7">
            <Box className="flex items-center justify-between">
              <BodyText as="span" size="sm" className="text-text-secondary">
                Hard Max:
              </BodyText>
              <BodyText as="span" size="sm" className="text-text-primary font-medium">
                {formatCurrency(goals.budget_max)}
              </BodyText>
            </Box>
            {goals.budget_stretch && (
              <Box className="flex items-center justify-between">
                <BodyText as="span" size="sm" className="text-text-secondary">
                  Stretch Budget:
                </BodyText>
                <BodyText as="span" size="sm" className="text-text-primary font-medium">
                  {formatCurrency(goals.budget_stretch)}
                </BodyText>
              </Box>
            )}
            <Box className="flex items-center justify-between">
              <BodyText as="span" size="sm" className="text-text-secondary">
                Minimum:
              </BodyText>
              <BodyText as="span" size="sm" className="text-text-primary font-medium">
                {formatCurrency(goals.budget_min)}
              </BodyText>
            </Box>
          </Box>
        </Box>

        {/* Must-Haves */}
        {goals.must_haves.length > 0 && (
          <Box>
            <Title as="h3" size="md" className="text-text-primary mb-3 font-semibold">
              Must-Haves
            </Title>
            <ul className="space-y-2">
              {goals.must_haves.map((item, index) => (
                <li
                  key={index}
                  className="text-responsive-sm text-text-primary flex items-center gap-2"
                >
                  <Icon name="target" className="text-primary h-4 w-4 flex-shrink-0" />
                  <BodyText as="span" size="sm" className="text-text-primary">
                    {item}
                  </BodyText>
                </li>
              ))}
            </ul>
          </Box>
        )}

        {/* Deal Breakers */}
        {goals.deal_breakers.length > 0 && (
          <Box>
            <Title
              as="h3"
              size="md"
              className="text-text-primary mb-3 flex items-center gap-2 font-semibold"
            >
              <Icon name="x-circle" className="text-destructive h-5 w-5" />
              Deal Breakers
            </Title>
            <ul className="space-y-2">
              {goals.deal_breakers.map((item, index) => (
                <li
                  key={index}
                  className="text-responsive-sm text-text-primary flex items-center gap-2"
                >
                  <Icon name="x-circle" className="text-destructive h-4 w-4 flex-shrink-0" />
                  <BodyText as="span" size="sm" className="text-text-primary">
                    {item}
                  </BodyText>
                </li>
              ))}
            </ul>
          </Box>
        )}

        {/* Timeline Urgency */}
        <Box>
          <Box className="mb-3 flex items-center gap-2">
            <Icon name="clock" className="text-accent h-5 w-5" />
            <Title as="h3" size="md" className="text-text-primary font-semibold">
              Timeline Urgency
            </Title>
          </Box>
          <Box
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 ${urgencyColors[goals.timeline_urgency]}`}
          >
            <BodyText as="span" size="sm" className="font-medium capitalize">
              {goals.timeline_urgency}
            </BodyText>
          </Box>
        </Box>
      </Box>
    </SectionCard>
  );
};
export default GoalsConstraints;
