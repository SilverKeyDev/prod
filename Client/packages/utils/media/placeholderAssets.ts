/**
 * Shared media fallback URLs that are safe to use from utilities.
 */
export const PLACEHOLDER_IMAGES: readonly string[] = [
  "/placeholders/dummy-photo.svg",
  "/placeholders/placeholder-living.svg",
  "/placeholders/placeholder-kitchen.svg",
  "/placeholders/placeholder-exterior.svg",
  "/placeholders/placeholder-bedroom.svg",
  "/placeholders/placeholder-bathroom.svg",
  "/placeholders/placeholder-garden.svg",
] as const;

export const DEFAULT_PLACEHOLDER_IMAGE = PLACEHOLDER_IMAGES[0];

export function getPlaceholderImage(index: number): string {
  return PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
}
