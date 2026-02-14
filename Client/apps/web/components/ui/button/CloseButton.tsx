import React, { forwardRef } from "react";
import { X } from "lucide-react";
import IconButton, { IconButtonProps } from "./IconButton";

export type CloseButtonProps = Omit<IconButtonProps, "icon" | "variant"> & {
  /**
   * Variant for close button. Defaults to "ghost" for standard close buttons.
   */
  variant?: "ghost" | "outline" | "toolbar";
  /**
   * Aria label for accessibility. Defaults to "Close".
   */
  "aria-label"?: string;
};

/**
 * Standardized Close Button component.
 *
 * A wrapper around IconButton with X icon for closing modals, dialogs, etc.
 * Mobile-responsive and touch-friendly.
 *
 * @example
 * ```tsx
 * <CloseButton onClick={handleClose} aria-label="Close modal" />
 * ```
 */
const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  (
    {
      variant = "ghost",
      size = "md",
      "aria-label": ariaLabel = "Close",
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
        aria-label={ariaLabel}
        className={className}
        {...props}
      />
    );
  },
);

CloseButton.displayName = "CloseButton";

export default CloseButton;
