import React from "react";

export interface CardInteriorBubblesProps {
  /** Position of the bubble */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Size variant for scaling */
  size?: "xs" | "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
  /** Children content */
  children: React.ReactNode;
}

const CardInteriorBubbles: React.FC<CardInteriorBubblesProps> = ({
  position = "top-right",
  size = "sm",
  className = "",
  children,
}) => {
  // Size variants for scaling margins and height
  const sizeStyles = {
    xs: {
      margin: "top-1.5 sm:top-2",
      horizontalMargin: "left-1.5 right-1.5 sm:left-2 sm:right-2",
      height: "h-6 sm:h-7",
    },
    sm: {
      margin: "top-2 sm:top-3",
      horizontalMargin: "left-2 right-2 sm:left-3 sm:right-3",
      height: "h-7 sm:h-8",
    },
    md: {
      margin: "top-2.5 sm:top-3.5",
      horizontalMargin: "left-2.5 right-2.5 sm:left-3.5 sm:right-3.5",
      height: "h-8 sm:h-9",
    },
    lg: {
      margin: "top-3 sm:top-4",
      horizontalMargin: "left-3 right-3 sm:left-4 sm:right-4",
      height: "h-9 sm:h-10",
    },
  };

  // Position styles with centered bubble positioning
  const getPositionStyles = (pos: string) => {
    const baseClasses = "absolute";

    switch (pos) {
      case "top-left":
        return `${baseClasses} top-2 sm:top-3 left-2 sm:left-3 -translate-x-1/2 -translate-y-1/2`;
      case "top-right":
        return `${baseClasses} top-2 sm:top-3 right-2 sm:right-3 translate-x-1/2 -translate-y-1/2`;
      case "bottom-left":
        return `${baseClasses} bottom-2 sm:bottom-3 left-2 sm:left-3 -translate-x-1/2 translate-y-1/2`;
      case "bottom-right":
        return `${baseClasses} bottom-2 sm:bottom-3 right-2 sm:right-3 translate-x-1/2 translate-y-1/2`;
      default:
        return `${baseClasses} top-2 sm:top-3 right-2 sm:right-3 translate-x-1/2 -translate-y-1/2`;
    }
  };

  const currentSizeConfig = sizeStyles[size];
  const positionClasses = getPositionStyles(position);

  const containerClasses = [
    positionClasses,
    currentSizeConfig.height,
    "flex items-center justify-center",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={containerClasses}>{children}</div>;
};

export default CardInteriorBubbles;
