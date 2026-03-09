import React from "react";

import type { LucideProps } from "lucide-react";

import type { IconName } from "packages/ui/types/icons";

import { getIcon } from "./iconMap";

export type IconProps = {
  name: IconName;
} & Omit<LucideProps, "ref">;

export function Icon({ name, ...props }: IconProps): JSX.Element | null {
  const IconComponent = getIcon(name);
  if (!IconComponent) return null;
  return <IconComponent {...props} />;
}
