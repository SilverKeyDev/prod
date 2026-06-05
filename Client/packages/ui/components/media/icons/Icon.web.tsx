import React from "react";

import type { LucideProps } from "lucide-react";

import type { IconName } from "packages/ui/types/icons";

import { getIcon } from "./iconMap";

export type IconProps = {
  name: IconName;
  /** When set, icon is exposed to assistive tech; otherwise decorative (aria-hidden). */
  label?: string;
} & Omit<LucideProps, "ref">;

export function Icon({
  name,
  label,
  "aria-hidden": ariaHidden,
  "aria-label": ariaLabel,
  ...props
}: IconProps): JSX.Element | null {
  const IconComponent = getIcon(name);
  if (!IconComponent) return null;
  const resolvedLabel = label ?? ariaLabel;
  const hidden = resolvedLabel == null && ariaHidden !== false ? true : ariaHidden;
  return <IconComponent {...props} aria-hidden={hidden} aria-label={resolvedLabel ?? undefined} />;
}
