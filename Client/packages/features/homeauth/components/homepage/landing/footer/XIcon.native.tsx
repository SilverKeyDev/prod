import Svg, { Path } from "react-native-svg";

import { color } from "packages/design-tokens";

import { X_ICON_PATH } from "./xIconPath";

export type XIconProps = { size?: number; className?: string };

/**
 * Native X (Twitter) mark drawn with react-native-svg.
 * The web variant relies on `fill="currentColor"` inheriting the button's text color; React Native
 * has no color inheritance, so the equivalent token is applied directly.
 */
export function XIcon({ size = 16 }: XIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={X_ICON_PATH} fill={color("text-secondary")} />
    </Svg>
  );
}
