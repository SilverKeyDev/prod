import React, { forwardRef } from "react";

import { Image as RNImage, type ImageProps as RNImageProps } from "react-native";

export type ImageProps = RNImageProps & {
  className?: string;
  /** Unified label for a11y; maps to accessibilityLabel on RN. */
  label?: string;
};

/**
 * Base Image primitive - RN Image for native.
 * Web uses img (Image.web.tsx). Use source={{ uri }} for cross-platform API.
 */
const Image = forwardRef<RNImage, ImageProps>(function Image(
  { source, className, style, label, ...props },
  ref
) {
  const a11yProps = label != null ? { accessibilityLabel: label } : {};
  return (
    <RNImage
      ref={ref}
      source={source}
      className={className}
      style={style}
      {...a11yProps}
      {...props}
    />
  );
});

export default Image;
