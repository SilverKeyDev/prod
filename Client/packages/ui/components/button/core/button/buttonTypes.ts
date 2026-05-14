import type React from "react";

import type { IconName } from "packages/ui/types/icons";

import type { HideTextBelowBreakpoint } from "./textVisibility";

/**
 * Variants: primary (CTA), secondary (neutral), tertiary (gold), outline, ghost, danger, success.
 * Cancel is a true alias of ghost (no separate style).
 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "outline"
  | "ghost"
  | "danger"
  | "success"
  | "cancel";

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  /** Icon element (e.g. Lucide icon). Rendered left of text by default. */
  icon?: React.ReactNode;
  /** Icon by name (platform-resolved). When both icon and iconName are set, icon takes precedence.
   *  Prefer passing iconName or icon whenever children include visible action text so the button can
   *  collapse to icon-only inside narrow layouts (web container queries). */
  iconName?: IconName;
  /** Icon position relative to text. Default "left". */
  iconPosition?: "left" | "right";
  /** "inline" = icon next to text; "edge" = flush right (only when iconPosition="right"). */
  iconAlign?: "inline" | "edge";
  /**
   * Horizontal alignment of label/content. Use "start" for list rows and menus so nested
   * JSX is not forced to justify-center/text-center by the inner wrapper.
   */
  contentAlign?: "center" | "start";
  fullWidth?: boolean;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";

  /**
   * If provided, hides button text below the given Tailwind breakpoint (icon-only on small screens).
   * When using hideTextBelow, you must provide label for accessibility (aria-label).
   * Example: hideTextBelow="md" will hide text on screens narrower than md (768px).
   */
  hideTextBelow?: HideTextBelowBreakpoint;

  /**
   * When false, string labels use nowrap without ellipsis so the button can grow with flex layout.
   * Default true (truncate long labels inside constrained widths).
   */
  truncateLabel?: boolean;

  /**
   * Web only: when true, hides the label and shows icon-only until the button is at least 11rem wide
   * (@container). Default false so icon+label buttons keep visible text in typical flex/toolbar layouts.
   */
  collapseIconWhenNarrow?: boolean;

  /**
   * Web only: merge styles and behavior onto the single child element (e.g. `react-router` `Link`).
   * Ignored on React Native. When true, `icon` / `iconName` are not rendered; compose inside the child.
   * Do not use with `loading` if you need the loading overlay — merged child keeps layout only.
   */
  asChild?: boolean;

  /**
   * Unified accessibility label. Maps to aria-label (web) and accessibilityLabel (RN).
   */
  label?: string;
  /** Cross-platform press handler. Web maps to onClick. */
  onPress?: (e?: unknown) => void;
  /** Web legacy; receives click event. Prefer onPress for cross-platform. */
  onClick?: (e?: unknown) => void;
  /** Merged onto the label row (string or JSX children) after default typography. */
  labelSlotClassName?: string;
  type?: "button" | "submit" | "reset";
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  title?: string;
  /** Inline styles (forwarded to Pressable). */
  style?: React.CSSProperties;
  id?: string;
  role?: string;
  "aria-current"?: React.AriaAttributes["aria-current"];
  /** Exclude from tab order when -1. Forwarded to underlying element. */
  tabIndex?: number;
  /** Accessibility label (alias for label; forwarded when label not set). */
  "aria-label"?: string;
  /** Combobox / disclosure (e.g. Dropdown). Forwarded to DOM on web. */
  "aria-expanded"?: React.AriaAttributes["aria-expanded"];
  "aria-controls"?: string;
  "aria-haspopup"?: React.AriaAttributes["aria-haspopup"];
  /** Listbox option selection state (e.g. Dropdown rows with `role="option"`). */
  "aria-selected"?: React.AriaAttributes["aria-selected"];
  /** Forwarded to Pressable (native) / implicit on web. */
  accessibilityRole?: string;
  accessibilityState?: Record<string, boolean | undefined>;
};
