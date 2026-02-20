import React, { forwardRef } from "react";

import { X } from "lucide-react";

import IconButton, { IconButtonProps } from "./IconButton";

export type CloseButtonProps = Omit<IconButtonProps, "icon" | "variant"> & {
  /**
   * Variant for close button. Defaults to "ghost" for standard close buttons.
   */
  variant?: "ghost" | "outline" | "toolbar";
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
 * Mobile-responsive and touch-friendly.
 *
 * @example
 * ```tsx
 * <CloseButton onClick={handleClose} label="Close modal" />
 * ```
 */
const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  (
    {
      variant = "ghost",
      size = "md",
      label = "Close",
      className = "",
      ...props
    },
    ref,
  ) => {
    return (
      <IconButton
        ref={ref}
        variant={variant}
        size={size}
        icon={<X className="h-full w-full" />}
        label={label}
        className={className}
        {...props}
      />
    );
  },
);

CloseButton.displayName = "CloseButton";

export default CloseButton;
