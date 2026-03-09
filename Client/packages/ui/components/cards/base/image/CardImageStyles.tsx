import React from "react";

import { Image } from "packages/ui/components/primitives";

import {
  getImageInlineStyles,
  getImageStyleClasses,
  type ImageStyleVariant,
} from "./CardImageStyleUtils";

type StyledImageProps = {
  src?: string;
  alt: string;
  variant?: ImageStyleVariant;
  className?: string;
  placeholder?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  loading?: "lazy" | "eager";
  style?: React.CSSProperties;
};

export const StyledImage: React.FC<StyledImageProps> = ({
  src,
  alt,
  variant = "professional",
  className = "",
  placeholder = "/api/placeholder/400/300",
  onError,
  loading = "lazy",
  style = {},
}) => {
  const baseClasses = getImageStyleClasses(variant);
  const inlineStyles = getImageInlineStyles(variant);

  return (
    <Image
      src={src ?? placeholder}
      alt={alt}
      className={`${baseClasses} ${className}`}
      style={{ ...inlineStyles, ...style }}
      loading={loading}
      onError={onError}
    />
  );
};

export default StyledImage;
