/**
 * Native screen dimensions — React Native `Dimensions` API.
 */

import { Dimensions } from "react-native";

export type ScreenDimensions = {
  width: number;
  height: number;
};

export function getScreenDimensions(): ScreenDimensions {
  const { width, height } = Dimensions.get("window");
  return { width, height };
}
