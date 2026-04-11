/**
 * Native button size map - inline styles for RN since CVA-assembled native: classes
 * don't apply at Babel transform time. Used by Button when isNative.
 */
import { Platform } from "react-native";

const nativeSizes = {
  sm: { paddingHorizontal: 16, paddingVertical: 8, minHeight: 36 },
  md: { paddingHorizontal: 20, paddingVertical: 10, minHeight: 44 },
  lg: { paddingHorizontal: 24, paddingVertical: 12, minHeight: 56 },
};

export const buttonNativeSizes = Platform.select({
  ios: nativeSizes,
  android: nativeSizes,
  default: {} as Record<
    string,
    { paddingHorizontal: number; paddingVertical: number; minHeight: number }
  >,
}) as Record<
  string,
  { paddingHorizontal: number; paddingVertical: number; minHeight: number }
>;
