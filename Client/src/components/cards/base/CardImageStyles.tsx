import React from "react";

import {
  getImageStyleClasses,
  getImageInlineStyles,
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
  placeholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==",
  onError,
  loading = "lazy",
  style = {},
}) => {
  const baseClasses = getImageStyleClasses(variant);
  const inlineStyles = getImageInlineStyles(variant);

  return (
    <img
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
