import { X } from "lucide-react";
import React, { forwardRef } from "react";
import Button, { ButtonProps } from "./Button";

export type CancelButtonProps = Omit<ButtonProps, "variant"> & {
  /**
   * Variant for cancel button. Defaults to "cancel" (gray preset matching settings).
   * Use "outline" for brand-accent outline, "ghost" for less prominent cancel actions.
   */
  variant?: "cancel" | "outline" | "ghost";
};

/**
 * Standardized Cancel Button component.
 *
 * A wrapper around Button with consistent cancel button styling.
 * Uses gray preset matching settings sidebar. Includes X icon by default.
 * Mobile-responsive and touch-friendly.
 *
 * @example
 * ```tsx
 * <CancelButton onClick={handleCancel}>Cancel</CancelButton>
 * ```
 */
const CancelButton = forwardRef<HTMLButtonElement, CancelButtonProps>(
  (
    {
      variant = "cancel",
      size = "md",
      children = "Cancel",
      icon,
      ...props
    },
    ref,
  ) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        icon={icon ?? <X />}
        {...props}
      >
        {children}
      </Button>
    );
  },
);

CancelButton.displayName = "CancelButton";

export default CancelButton;
