import React, { type CSSProperties, forwardRef } from "react";

import { flattenWebStyle, type WebStyleInput } from "packages/ui/utils/flattenWebStyle";

/** RN-style state; mapped to aria-* on web (explicit HTML attrs win when both are set). */
export type BoxRnAccessibilityState = {
  disabled?: boolean;
  selected?: boolean;
  checked?: boolean | "mixed";
  busy?: boolean;
  expanded?: boolean;
};

export type BoxProps = Omit<React.HTMLAttributes<HTMLDivElement>, "style"> & {
  style?: WebStyleInput;
  accessibilityLabel?: string;
  accessibilityRole?: React.AriaRole | string;
  accessibilityState?: BoxRnAccessibilityState;
  accessibilityHint?: string;
  accessibilityLevel?: number;
};

function ariaFromRnAccessibilityState(
  state: BoxRnAccessibilityState | undefined
): Pick<
  React.HTMLAttributes<HTMLDivElement>,
  "aria-busy" | "aria-checked" | "aria-disabled" | "aria-expanded" | "aria-selected"
> {
  if (!state) {
    return {};
  }
  const out: Pick<
    React.HTMLAttributes<HTMLDivElement>,
    "aria-busy" | "aria-checked" | "aria-disabled" | "aria-expanded" | "aria-selected"
  > = {};
  if (state.busy !== undefined) {
    out["aria-busy"] = state.busy;
  }
  if (state.checked !== undefined) {
    out["aria-checked"] = state.checked;
  }
  if (state.disabled !== undefined) {
    out["aria-disabled"] = state.disabled;
  }
  if (state.expanded !== undefined) {
    out["aria-expanded"] = state.expanded;
  }
  if (state.selected !== undefined) {
    out["aria-selected"] = state.selected;
  }
  return out;
}

/**
 * React Native `View` is a flex container by default. A plain `div` only becomes
 * flex when `display: flex` is set; otherwise `flexDirection` / `flex` children
 * do not lay out and rows collapse (e.g. week calendar columns bunched left).
 */
function withRnAlignedFlexDisplay(flat: CSSProperties): CSSProperties {
  if (flat.display != null) {
    return flat;
  }
  if (flat.flexDirection == null && flat.flexWrap == null) {
    return flat;
  }
  return { display: "flex", ...flat };
}

/**
 * Base Box primitive - one div for React (web).
 * Native uses View. Use this (or the resolved Box) so layout is platform-agnostic.
 */
const Box = forwardRef<HTMLDivElement, BoxProps>(function Box(
  {
    className = "",
    style,
    accessibilityLabel,
    accessibilityRole,
    accessibilityState,
    accessibilityHint: _accessibilityHint,
    accessibilityLevel,
    role,
    "aria-label": ariaLabel,
    "aria-busy": ariaBusy,
    "aria-checked": ariaChecked,
    "aria-disabled": ariaDisabled,
    "aria-expanded": ariaExpanded,
    "aria-selected": ariaSelected,
    ...rest
  },
  ref
) {
  const flat = withRnAlignedFlexDisplay(flattenWebStyle(style));
  const fromState = ariaFromRnAccessibilityState(accessibilityState);
  const resolvedRole = role ?? accessibilityRole;
  const resolvedAriaLabel = ariaLabel ?? accessibilityLabel;
  const ariaMerged: Pick<
    React.HTMLAttributes<HTMLDivElement>,
    "aria-busy" | "aria-checked" | "aria-disabled" | "aria-expanded" | "aria-selected"
  > = {
    ...fromState,
    ...(ariaBusy !== undefined ? { "aria-busy": ariaBusy } : {}),
    ...(ariaChecked !== undefined ? { "aria-checked": ariaChecked } : {}),
    ...(ariaDisabled !== undefined ? { "aria-disabled": ariaDisabled } : {}),
    ...(ariaExpanded !== undefined ? { "aria-expanded": ariaExpanded } : {}),
    ...(ariaSelected !== undefined ? { "aria-selected": ariaSelected } : {}),
  };

  return (
    <div
      ref={ref}
      className={className}
      style={Object.keys(flat).length > 0 ? flat : undefined}
      {...rest}
      {...ariaMerged}
      {...(resolvedRole != null ? { role: resolvedRole as React.AriaRole } : {})}
      {...(resolvedAriaLabel != null ? { "aria-label": resolvedAriaLabel } : {})}
      {...(accessibilityLevel != null ? { "aria-level": accessibilityLevel } : {})}
    />
  );
});

export default Box;
