import React from "react";

import { StyledImage } from "./CardImageStyles";
import { type ImageStyleVariant } from "./CardImageStyleUtils";

type CardImageContainerProps = {
  /** Image URL */
  imageUrl?: string;
  /** Alt text for the image */
  alt: string;
  /** Height variant */
  height?: "sm" | "md" | "lg" | "responsive";
  /** Image style variant for professional appearance */
  imageVariant?: ImageStyleVariant;
  /** Additional className */
  className?: string;
  /** Children to overlay on the image */
  children?: React.ReactNode;
};

/**
 * Reusable card image container with consistent styling and responsive heights
 */
export default function CardImageContainer({
  imageUrl,
  alt,
  height = "md",
  imageVariant = "professional",
  className = "",
  children,
}: CardImageContainerProps) {
  const placeholder = "/api/placeholder/400/300";

  const getHeightClass = () => {
    switch (height) {
      case "sm":
        return "h-24 sm:h-28 md:h-32";
      case "md":
        return "h-32 sm:h-40 md:h-48";
      case "lg":
        return "h-40 sm:h-48 md:h-56";
      case "responsive":
        return "h-32 sm:h-36 md:h-40";
      default:
        return "h-32 sm:h-40 md:h-48";
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden bg-gray-100 ${getHeightClass()} ${className}`}
    >
      <StyledImage
        src={imageUrl ?? undefined}
        alt={alt}
        variant={imageVariant || "professional"}
        placeholder={placeholder}
        className="h-full w-full"
      />
      {children && <div className="absolute inset-0">{children}</div>}
    </div>
  );
}
