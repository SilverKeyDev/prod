import React from "react";

import {
  ArrowLeft,
  Download,
  Eye,
  Map,
  MapPin,
  Pencil,
  Plus,
  Search,
  Settings2,
  Share,
  SlidersHorizontal,
  Trash2,
  Video,
  X,
} from "lucide-react";

import type { IconName } from "packages/ui/types/icons";

const ICON_MAP: Record<IconName, React.ComponentType<{ className?: string }>> = {
  "arrow-left": ArrowLeft,
  download: Download,
  eye: Eye,
  map: Map,
  "map-pin": MapPin,
  pencil: Pencil,
  plus: Plus,
  search: Search,
  settings: Settings2,
  share: Share,
  "sliders-horizontal": SlidersHorizontal,
  trash: Trash2,
  video: Video,
  x: X,
};

/**
 * Returns the icon element for the given name (web: Lucide).
 * Button applies size class via renderIcon; pass result to Button as icon when using iconName.
 */
export function getIcon(name: IconName): React.ReactNode {
  const IconComponent = ICON_MAP[name];
  return IconComponent ? <IconComponent /> : null;
}
