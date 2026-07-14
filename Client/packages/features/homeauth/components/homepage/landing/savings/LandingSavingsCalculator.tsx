import { useState } from "react";

import { LandingEyebrow } from "packages/features/homeauth/components/homepage/landing/shared/LandingEyebrow";
import { LandingSectionShell } from "packages/features/homeauth/components/homepage/landing/shared/LandingSectionShell";
import { useLandingReveal } from "packages/features/homeauth/hooks/useLandingReveal";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import {
  computeLandingSavings,
  formatLandingSavingsCurrency,
} from "packages/features/homeauth/utils/landingSavingsMath";
import { scrollToLandingSection } from "packages/features/homeauth/utils/landingScroll";
import { LANDING_SECTION_IDS } from "packages/features/homeauth/utils/landingSectionIds";
import { LANDING_SECTION_LAYOUT } from "packages/features/homeauth/utils/landingSectionLayout";
import {
  trackLandingCta,
  trackLandingSlider,
} from "packages/hooks/analytics/trackLandingAnalytics";
import PriceRangeSlider from "packages/ui/components/inputs/form/preferences/PriceRangeSlider";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Button, Title } from "@/components/ui";

import { LandingRangeInput } from "./LandingRangeInput";

const GCI_TICK_VALUES = [
  30000, 50000, 75000, 85000, 100000, 125000, 150000, 200000, 250000, 300000,
];

function formatSliderDisplay(sliderId: string, value: number): string {
  if (sliderId === "sl-gci") {
    return `$${value.toLocaleString()}`;
  }
  if (sliderId === "sl-growth") {
    return `${value}%`;
  }
  return String(value);
}

export function LandingSavingsCalculator() {
  const { savings } = LANDING_CONTENT;
  const [agents, setAgents] = useState(savings.sliders[0]?.defaultValue ?? 35);
  const [gci, setGci] = useState(savings.sliders[1]?.defaultValue ?? 85000);
  const [growth, setGrowth] = useState(savings.sliders[2]?.defaultValue ?? 30);
  const { ref: sectionRef, inView } = useLandingReveal();

  const { growthAgents, upliftPerAgent, total } = computeLandingSavings({
    agents,
    gci,
    growthPercent: growth,
  });

  const setSliderValue = (sliderId: string, value: number) => {
    trackLandingSlider(sliderId, value);
    if (sliderId === "sl-agents") setAgents(value);
    if (sliderId === "sl-gci") setGci(value);
    if (sliderId === "sl-growth") setGrowth(value);
  };

  return (
    <LandingSectionShell
      id={LANDING_SECTION_IDS.savings}
      layout={LANDING_SECTION_LAYOUT[LANDING_SECTION_IDS.savings]}
      className="px-responsive-sm py-16 sm:py-20"
      fullBleed
    >
      <Box
        className={`mx-auto max-w-2xl text-center motion-safe:transition-all motion-safe:duration-500 motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
          inView ? "translate-y-0 opacity-100" : "motion-safe:translate-y-8 motion-safe:opacity-0"
        }`}
      >
        <LandingEyebrow>{savings.eyebrow}</LandingEyebrow>
        <Title as="h2" size="lg" className="text-center !font-serif">
          {savings.headline}
        </Title>
      </Box>

      <Box
        ref={sectionRef}
        className={`border-brand-primary/20 mx-auto mt-10 grid max-w-4xl grid-cols-1 overflow-hidden rounded-2xl border-2 shadow-lg motion-safe:transition-all motion-safe:delay-150 motion-safe:duration-[550ms] motion-reduce:scale-100 motion-reduce:opacity-100 md:grid-cols-2 ${
          inView ? "scale-100 opacity-100" : "motion-safe:scale-[0.94] motion-safe:opacity-0"
        }`}
      >
        <Box className="bg-background-surface p-8 sm:p-9">
          <BodyText as="p" size="sm" className="mb-6 font-semibold">
            {savings.panelHeading}
          </BodyText>
          {savings.sliders.map((slider) => (
            <Box key={slider.id} className="mb-6 last:mb-0">
              <BodyText as="p" size="xs" muted className="mb-2 font-semibold">
                {slider.label}
              </BodyText>
              {slider.id === "sl-gci" ? (
                <PriceRangeSlider
                  tickValues={GCI_TICK_VALUES}
                  value={gci}
                  onChange={(value) => setSliderValue(slider.id, value)}
                  formatValue={(value) => formatSliderDisplay(slider.id, value)}
                />
              ) : (
                <LandingRangeInput
                  id={slider.id}
                  label={slider.label}
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={
                    slider.id === "sl-agents"
                      ? agents
                      : slider.id === "sl-growth"
                        ? growth
                        : slider.defaultValue
                  }
                  formatValue={(value) => formatSliderDisplay(slider.id, value)}
                  onChange={(value) => setSliderValue(slider.id, value)}
                />
              )}
            </Box>
          ))}
        </Box>

        <Box className="border-gold bg-background-surface border-l-0 p-8 sm:border-l-2 sm:p-9 md:border-l-2">
          <BodyText
            as="p"
            size="xs"
            muted
            className="mb-1.5 font-semibold uppercase tracking-widest"
          >
            {savings.resultHeading}
          </BodyText>
          <Title as="p" size="xl" className="!text-gold mb-1 !font-serif leading-none">
            {formatLandingSavingsCurrency(total)}
          </Title>
          <BodyText as="p" size="xs" muted className="mb-5">
            {savings.resultSub}
          </BodyText>

          <Box className="border-border flex flex-col gap-2.5 border-t pt-4">
            {[
              {
                label: savings.breakdownLabels.agentsReady,
                value: `${growthAgents} ${growthAgents === 1 ? "agent" : "agents"}`,
              },
              {
                label: savings.breakdownLabels.upliftPerAgent,
                value: `+${formatLandingSavingsCurrency(upliftPerAgent)}`,
              },
              {
                label: savings.breakdownLabels.totalUpside,
                value: `${formatLandingSavingsCurrency(total)} / yr`,
              },
            ].map((row) => (
              <Box key={row.label} className="flex justify-between">
                <BodyText as="span" size="xs" muted>
                  {row.label}
                </BodyText>
                <BodyText as="span" size="xs" className="font-semibold">
                  {row.value}
                </BodyText>
              </Box>
            ))}
          </Box>

          <Button
            variant="primary"
            size="md"
            className="mt-5 w-full"
            onPress={() => {
              trackLandingCta("savings-calculator");
              scrollToLandingSection(LANDING_SECTION_IDS.finalCta);
            }}
          >
            {savings.resultCtaLabel}
          </Button>
        </Box>
      </Box>
    </LandingSectionShell>
  );
}
