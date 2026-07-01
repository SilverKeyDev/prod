import { LANDING_NAV_MAIN_OFFSET_CLASS } from "packages/features/homeauth/utils/landingChrome";
import { useLandingHashScroll } from "packages/navigation";
import { Box } from "packages/ui/components/structure/primitives";

import {
  LandingDemoPreview,
  LandingFAQ,
  LandingFinalCTA,
  LandingFooter,
  LandingHero,
  LandingInfoSection,
  LandingNav,
  LandingPartners,
  LandingPricing,
  LandingSavingsCalculator,
} from "./landing";
import type { HomeFeatureProps } from "./types";

export function HomeFeature(_props: HomeFeatureProps) {
  useLandingHashScroll(true);

  return (
    <Box className="hide-scrollbar bg-background-base flex min-h-screen min-w-0 flex-col overflow-x-hidden">
      <LandingNav />
      <main className={`flex flex-1 flex-col ${LANDING_NAV_MAIN_OFFSET_CLASS}`}>
        <LandingHero />
        <LandingDemoPreview />
        <LandingPartners />
        <LandingInfoSection />
        <LandingSavingsCalculator />
        <LandingPricing />
        <LandingFAQ />
        <LandingFinalCTA />
      </main>
      <LandingFooter />
    </Box>
  );
}
