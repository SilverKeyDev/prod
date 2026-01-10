import React, { forwardRef } from "react";
import Button, { ButtonProps } from "./Button";

export type CancelButtonProps = Omit<ButtonProps, "variant"> & {
  /**
   * Variant for cancel button. Defaults to "outline" for standard cancel buttons.
   * Use "ghost" for less prominent cancel actions.
   */
  variant?: "outline" | "ghost";
};

/**
 * Standardized Cancel Button component.
 * 
 * A wrapper around Button with consistent cancel button styling.
 * Mobile-responsive and touch-friendly.
 * 
 * @example
 * ```tsx
 * <CancelButton onClick={handleCancel}>Cancel</CancelButton>
 * ```
 */
const CancelButton = forwardRef<HTMLButtonElement, CancelButtonProps>(
  ({ variant = "outline", size = "md", children = "Cancel", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

CancelButton.displayName = "CancelButton";

export default CancelButton;
