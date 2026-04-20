import React, { forwardRef } from "react";

import { Box } from "packages/ui/components/primitives";

import { getBaseCardClasses, getCardScaleInlineStyle } from "./base/BaseCardStyles";

export type BaseCardProps = {
  variant?: "default" | "elevated" | "outlined" | "flat";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  rounded?: "none" | "sm" | "md" | "lg" | "xl";
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  hover?: boolean;
  interactive?: boolean;
  loading?: boolean;
  cardType?: "searchpage" | "regular";
  width?: "auto" | "full" | "standard" | "wide" | "narrow";
  height?: "auto" | "full" | "standard" | "tall" | "compact";
  scale?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  /** When "white", use solid white background (e.g. home and document cards). */
  background?: "default" | "white";
} & React.HTMLAttributes<HTMLDivElement>;

const BaseCard = forwardRef<HTMLDivElement, BaseCardProps>(
  (
    {
      variant = "default",
      padding = "md",
      rounded = "xl",
      shadow = "sm",
      hover = false,
      interactive = false,
      loading = false,
      cardType = "regular",
      width,
      height,
      scale,
      background,
      className = "",
      style,
      children,
      ...props
    },
    ref
  ) => {
    const cardClasses = getBaseCardClasses({
      variant,
      padding,
      rounded,
      shadow,
      hover,
      interactive,
      loading,
      cardType,
      width,
      height,
      scale,
      background,
      className,
    });
    const scaleStyle = getCardScaleInlineStyle(scale, cardType);
    return (
      <Box ref={ref} className={cardClasses} style={{ ...scaleStyle, ...style }} {...props}>
        {children}
      </Box>
    );
  }
);

BaseCard.displayName = "BaseCard";

export default BaseCard;
