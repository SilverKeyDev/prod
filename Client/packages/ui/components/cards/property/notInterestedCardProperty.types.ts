/**
 * Minimal property shape for not-interested UI. Keeps `packages/ui` free of
 * `packages/features/search` (and `@/features/search`) type imports.
 */
export type NotInterestedCardProperty = {
  address?: string;
  imageUrl?: string;
  images?: (string | { url?: string })[];
};
