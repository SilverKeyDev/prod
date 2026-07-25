import type { LandingPartnerLogoKey } from "packages/features/homeauth/types/landingContent";

import { LANDING_PARTNER_LOGO_URI } from "./landingPartnerLogoUris";

/** Public partner logo paths for the landing page (web). */
export { LANDING_PARTNER_LOGO_URI };

export function getLandingPartnerLogoUri(logoKey: LandingPartnerLogoKey): string {
  return LANDING_PARTNER_LOGO_URI[logoKey];
}
