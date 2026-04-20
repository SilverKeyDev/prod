import { spacing } from "packages/design-tokens";

export const MAIN_IMAGE_HEIGHT = 280;
export const THUMB_SIZE = 72;

export function spacingToNumber(token: string): number {
  const remMatch = token.match(/^([\d.]+)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  const pxMatch = token.match(/^(\d+)px$/);
  if (pxMatch) return parseInt(pxMatch[1], 10);
  return 0;
}

export const THUMB_GAP = spacingToNumber(spacing(2));
