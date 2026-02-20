import React, { forwardRef } from "react";

import { getBaseCardClasses } from "./base/BaseCardStyles";

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
      className = "",
      children,
      ...props
    },
    ref,
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
      className,
    });
    return (
      <div ref={ref} className={cardClasses} {...props}>
        {children}
      </div>
    );
  },
);

BaseCard.displayName = "BaseCard";

export default BaseCard;
