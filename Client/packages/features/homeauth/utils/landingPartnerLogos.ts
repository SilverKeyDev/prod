import type { LandingPartnerLogoKey } from "packages/features/homeauth/types/landingContent";

/** Public partner logo paths for the landing page (web). */
export const LANDING_PARTNER_LOGO_URI: Record<LandingPartnerLogoKey, string> = {
  "move-concierge": "/partners/move-concierge.svg",
  "ga-agent": "/partners/ga-agent.svg",
};

export function getLandingPartnerLogoUri(logoKey: LandingPartnerLogoKey): string {
  return LANDING_PARTNER_LOGO_URI[logoKey];
}
