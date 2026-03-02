import React, { forwardRef } from "react";

import type {
  Image as RNImage,
  ImageProps as RNImageProps,
  ImageSourcePropType,
} from "react-native";
import { Image } from "react-native";

import type { BaseAppImageProps } from "./AppImage.shared";

export type AppImageProps = BaseAppImageProps &
  Omit<RNImageProps, "source" | "accessibilityLabel"> & {
    /**
     * Native image source. When omitted, `uri` (if provided) will be
     * converted to `{ uri }` for convenience.
     */
    source?: ImageSourcePropType;
  };

/**
 * Cross-platform-friendly Image wrapper for React Native.
 * Accepts `uri` for remote images and forwards a properly-shaped `source`
 * to the underlying React Native Image.
 */
const AppImage = forwardRef<RNImage, AppImageProps>(function AppImage(
  { uri, source, alt, accessibilityLabel, ...rest },
  ref
) {
  const resolvedSource: ImageSourcePropType =
    source ?? (uri ? { uri } : (undefined as ImageSourcePropType));

  const resolvedAccessibilityLabel = accessibilityLabel ?? alt;

  return (
    <Image
      ref={ref}
      source={resolvedSource}
      accessibilityLabel={resolvedAccessibilityLabel}
      {...rest}
    />
  );
});

export default AppImage;
