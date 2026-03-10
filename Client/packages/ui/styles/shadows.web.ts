/**
 * Web shadow adapter: maps shared design tokens to CSS box-shadow.
 * No React, no DOM — pure function.
 */

import { type ShadowTokenName, shadowTokens } from "packages/design-tokens";

function buildCss(t: (typeof shadowTokens)[ShadowTokenName], color: string): string {
  return `${t.offsetX}px ${t.offsetY}px ${t.blur}px ${t.spread}px ${color}`;
}

/**
 * Returns a CSS box-shadow value for the given token.
 * @param name - Token name (subtle, elevated, card)
 * @param color - Optional; defaults to rgba(0,0,0, token.opacity)
 */
export function boxShadow(name: ShadowTokenName, color?: string): string {
  const t = shadowTokens[name];
  const c = color ?? `rgba(0, 0, 0, ${t.opacity})`;
  return buildCss(t, c);
}

export type { ShadowTokenName };
