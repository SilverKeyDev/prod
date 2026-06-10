import React from "react";

import { Image } from "packages/ui/components/structure/primitives";

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
  /** LCP: high priority for first above-the-fold listing card images on search. */
  fetchPriority?: "auto" | "high" | "low";
  style?: React.CSSProperties;
};

export const StyledImage: React.FC<StyledImageProps> = ({
  src,
  alt,
  variant = "professional",
  className = "",
  placeholder = "/placeholders/dummy-photo.svg",
  onError,
  loading = "lazy",
  fetchPriority,
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
      fetchPriority={fetchPriority}
      onError={onError}
    />
  );
};

export default StyledImage;
