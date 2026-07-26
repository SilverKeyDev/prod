import type { LandingPartnerLogoKey } from "packages/features/homeauth/types/landingContent";

/**
 * Public partner logo paths for the landing page, shared by web and native.
 *
 * Deliberately has no `.web`/`.native` variants: the platform-specific
 * `landingPartnerLogos.*` files import this instead of `./landingPartnerLogos`,
 * which on native would resolve back to the importing file itself and leave the
 * binding undefined at module init.
 */
export const LANDING_PARTNER_LOGO_URI: Record<LandingPartnerLogoKey, string> = {
  "move-concierge": "/partners/move-concierge.svg",
  "ga-agent": "/partners/ga-agent.svg",
};
