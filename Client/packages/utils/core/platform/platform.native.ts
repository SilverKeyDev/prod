/**
 * Platform detection utilities for React Native
 */

import { Platform as RNPlatform } from "react-native";

export const Platform = {
  OS: RNPlatform.OS,
  select: RNPlatform.select,
};

export const isWeb = false;
export const isNative = true;
