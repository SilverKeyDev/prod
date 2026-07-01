import type { LandingPartnerLogoKey } from "packages/features/homeauth/types/landingContent";

import { LANDING_PARTNER_LOGO_URI } from "./landingPartnerLogos";

/** Native resolves the same public URIs for web parity in Expo web builds. */
export const LANDING_PARTNER_LOGO_SOURCE: Record<LandingPartnerLogoKey, { uri: string } | number> =
  {
    "move-concierge": { uri: LANDING_PARTNER_LOGO_URI["move-concierge"] },
    "ga-agent": { uri: LANDING_PARTNER_LOGO_URI["ga-agent"] },
  };

export function getLandingPartnerLogoUri(logoKey: LandingPartnerLogoKey): string {
  return LANDING_PARTNER_LOGO_URI[logoKey];
}
