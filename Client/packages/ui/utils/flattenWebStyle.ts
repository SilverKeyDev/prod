import type { CSSProperties } from "react";

type Falsy = false | null | undefined;

/**
 * React DOM `style` must be a plain object. RN-style `style={[a, b]}` must be merged
 * before passing to `<div>` / `<p>` / `<button>` (otherwise spreads become numeric keys
 * and React throws on CSSStyleDeclaration indexed setters).
 */
export type WebStyleInput = CSSProperties | Falsy | ReadonlyArray<CSSProperties | Falsy>;

export function flattenWebStyle(style: WebStyleInput | undefined): CSSProperties {
  if (style == null || style === false) {
    return {};
  }
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.filter(Boolean)) as CSSProperties;
  }
  return style as CSSProperties;
}
