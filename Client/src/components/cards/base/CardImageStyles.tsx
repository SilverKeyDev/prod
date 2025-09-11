import React from "react";

export type ImageStyleVariant =
  | "default"
  | "professional"
  | "muted"
  | "vibrant";

export interface ImageStyleConfig {
  filter: string;
  hoverFilter?: string;
  transition?: string;
  className?: string;
}

const IMAGE_STYLE_CONFIGS: Record<ImageStyleVariant, ImageStyleConfig> = {
  default: {
    filter: "none",
    className: "object-cover",
  },
  professional: {
    filter: "saturate(0.8) brightness(0.9) contrast(1.1)",
    hoverFilter: "saturate(0.95) brightness(1.0) contrast(1.05)",
    transition: "filter 0.3s ease, transform 0.3s ease",
    className: "object-cover",
  },
  muted: {
    filter: "saturate(0.7) brightness(0.85) contrast(1.05)",
    hoverFilter: "saturate(0.85) brightness(0.95) contrast(1.0)",
    transition: "filter 0.3s ease",
    className: "object-cover",
  },
  vibrant: {
    filter: "saturate(1.1) brightness(1.05) contrast(0.95)",
    hoverFilter: "saturate(1.2) brightness(1.1) contrast(0.9)",
    transition: "filter 0.3s ease",
    className: "object-cover",
  },
};

export function getImageStyleClasses(
  variant: ImageStyleVariant = "professional",
): string {
  const config = IMAGE_STYLE_CONFIGS[variant];
  return config.className || "object-cover";
}

export function getImageInlineStyles(
  variant: ImageStyleVariant = "professional",
): React.CSSProperties {
  const config = IMAGE_STYLE_CONFIGS[variant];
  return {
    filter: config.filter,
    transition: config.transition || "filter 0.3s ease",
  };
}

export function getImageHoverStyles(
  variant: ImageStyleVariant = "professional",
): React.CSSProperties {
  const config = IMAGE_STYLE_CONFIGS[variant];
  return {
    filter: config.hoverFilter || config.filter,
    transition: config.transition || "filter 0.3s ease",
  };
}

interface StyledImageProps {
  src?: string;
  alt: string;
  variant?: ImageStyleVariant;
  className?: string;
  placeholder?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  loading?: "lazy" | "eager";
  style?: React.CSSProperties;
}

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
    <img
      src={src || placeholder}
      alt={alt}
      className={`${baseClasses} ${className}`}
      style={{ ...inlineStyles, ...style }}
      loading={loading}
      onError={onError}
    />
  );
};

export default StyledImage;
