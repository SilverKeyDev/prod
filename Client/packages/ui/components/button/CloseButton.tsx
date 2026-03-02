import React, { forwardRef } from "react";

import { X } from "lucide-react";

import IconButton, { IconButtonProps } from "./IconButton";
import {
  OVERLAY_MARKER_CIRCLE_CLASSES,
  OVERLAY_MARKER_ICON_BUTTON_SIZE,
  OVERLAY_MARKER_ICON_CLASSES,
} from "./overlayMarkerButtonTypes";

export type CloseButtonSize = IconButtonProps["size"] | "overlay";

export type CloseButtonProps = Omit<IconButtonProps, "icon" | "variant" | "size"> & {
  /**
   * Variant for close button. Defaults to "ghost" for standard close buttons.
   */
  variant?: "ghost" | "outline" | "toolbar";
  /**
   * Size. Use "overlay" for modals/cards so it matches the HeartSave marker size.
   */
  size?: CloseButtonSize;
  /**
   * Unified accessibility label. Maps to aria-label (web) and accessibilityLabel (RN).
   * Defaults to "Close".
   */
  label?: string;
};

/**
 * Standardized Close Button component.
 *
 * A wrapper around IconButton with X icon for closing modals, dialogs, etc.
 * Use size="overlay" in modals/cards so the X matches the CardHeartSave marker size.
 * Mobile-responsive and touch-friendly.
 *
 * @example
 * ```tsx
 * <CloseButton onClick={handleClose} label="Close modal" />
 * <CloseButton size="overlay" onClick={onClose} label="Close modal" />
 * ```
 */
const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  ({ variant = "ghost", size = "md", label = "Close", className = "", ...props }, ref) => {
    const isOverlay = size === "overlay";
    const iconButtonSize = isOverlay ? OVERLAY_MARKER_ICON_BUTTON_SIZE : size;
    const sizeClassName = isOverlay ? OVERLAY_MARKER_CIRCLE_CLASSES : "";
    const iconClassName = isOverlay ? OVERLAY_MARKER_ICON_CLASSES : "h-full w-full";

    return (
      <IconButton
        ref={ref}
        variant={variant}
        size={iconButtonSize}
        icon={<X className={iconClassName} />}
        label={label}
        className={`${sizeClassName} ${className}`.trim()}
        {...props}
      />
    );
  }
);

CloseButton.displayName = "CloseButton";

export default CloseButton;
