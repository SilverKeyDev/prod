/**
 * Native implementation of HomeFeature.
 * Wraps HomeScreenNative to provide consistent API across platforms.
 */

import { HomeScreenNative } from "./HomeScreenNative.native";
import type { HomeFeatureProps } from "./types";

export function HomeFeature(_props: HomeFeatureProps) {
  return <HomeScreenNative />;
}
