import { LOGO_URI } from "packages/ui/components/media/asset/logoSource";
import { getWindow } from "packages/utils/core/platform";

/** Absolute logo URL for campaign email iframe previews (same-origin /logo.png). */
export function getCampaignPreviewLogoUrl(): string {
  const win = getWindow();
  if (win?.location?.origin) {
    return `${win.location.origin}${LOGO_URI}`;
  }
  return LOGO_URI;
}
