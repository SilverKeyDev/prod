import React, { forwardRef } from "react";

import { X } from "lucide-react";

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
 * Wraps Button with variant="cancel" (alias for ghost: tint-on-hover, no fill).
 * Recommended for confirmations: Primary CTA + Ghost cancel. Includes X icon by default.
 *
 * @example
 * <CancelButton onClick={handleCancel}>Cancel</CancelButton>
 */
const CancelButton = forwardRef<HTMLButtonElement, CancelButtonProps>(
  ({ variant = "cancel", size = "md", children = "Cancel", icon, ...props }, ref) => {
    return (
      <Button ref={ref} variant={variant} size={size} icon={icon ?? <X />} {...props}>
        {children}
      </Button>
    );
  }
);

CancelButton.displayName = "CancelButton";

export default CancelButton;
