import { LANDING_NAV_MAIN_OFFSET_CLASS } from "packages/features/homeauth/utils/landingChrome";
import { useLandingHashScroll, useNavigation } from "packages/navigation";
import { Box } from "packages/ui/components/structure/primitives";

import {
  LandingBrokerages,
  LandingFeatureStrip,
  LandingFooter,
  LandingHeroSplit,
  LandingNav,
  LandingSocialProof,
} from "./landing";
import type { HomeFeatureProps } from "./types";

export function HomeFeature(_props: HomeFeatureProps) {
  const { navigate } = useNavigation();
  useLandingHashScroll(true);

  const goSignUp = () => {
    navigate("SIGNUP");
  };

  return (
    <Box className="hide-scrollbar bg-background-base flex min-h-screen min-w-0 flex-col overflow-x-hidden">
      <LandingNav onSignUp={goSignUp} />
      <main className={`flex flex-1 flex-col ${LANDING_NAV_MAIN_OFFSET_CLASS}`}>
        <LandingHeroSplit />
        <LandingFeatureStrip />
        <LandingBrokerages />
        <LandingSocialProof />
        <LandingFooter />
      </main>
    </Box>
  );
}
