/** How a partner checklist integration is shown to buyers (admin-configured). */
export const PARTNER_INTEGRATION_DISPLAY_MODES = ["iframe_and_link", "link_only"] as const;

export type PartnerIntegrationDisplayMode = (typeof PARTNER_INTEGRATION_DISPLAY_MODES)[number];

export const DEFAULT_PARTNER_INTEGRATION_DISPLAY_MODE: PartnerIntegrationDisplayMode =
  "iframe_and_link";

export function isPartnerIntegrationDisplayMode(
  value: string | null | undefined
): value is PartnerIntegrationDisplayMode {
  return value === "iframe_and_link" || value === "link_only";
}

export function normalizePartnerIntegrationDisplayMode(
  value: string | null | undefined
): PartnerIntegrationDisplayMode {
  return isPartnerIntegrationDisplayMode(value) ? value : DEFAULT_PARTNER_INTEGRATION_DISPLAY_MODE;
}

export function partnerShowsIframe(mode: PartnerIntegrationDisplayMode): boolean {
  return mode === "iframe_and_link";
}
