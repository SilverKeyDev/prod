import React from "react";

import { MaterialIcons } from "@expo/vector-icons";

import { color } from "packages/design-tokens";
import type { IconName } from "packages/ui/types/icons";

const ICON_MAP: Record<IconName, keyof typeof MaterialIcons.glyphMap> = {
  "arrow-left": "arrow-back",
  download: "download",
  eye: "visibility",
  map: "map",
  "map-pin": "place",
  pencil: "edit",
  plus: "add",
  search: "search",
  settings: "settings",
  share: "share",
  "sliders-horizontal": "tune",
  trash: "delete",
  video: "videocam",
  x: "close",
};

/**
 * Returns the icon element for the given name (native: MaterialIcons).
 * Same API as web for Button renderIcon / iconName.
 */
export function getIcon(name: IconName): React.ReactNode {
  const iconName = ICON_MAP[name];
  if (!iconName) return null;
  return <MaterialIcons name={iconName} size={24} color={color("neutral.700")} />;
}
