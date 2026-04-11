import React, { useMemo } from "react";

import { color as tokenColor } from "packages/design-tokens";
import type { IconName } from "packages/ui/types/icons";

import { getIcon } from "./iconMap";

const TAILWIND_STEP_PX = 4;

function deriveSizeFromClassName(className?: string): number | undefined {
  if (!className) return undefined;

  // Tailwind patterns we commonly use: `h-4 w-4`, `size-5`, etc.
  const sizeMatch = className.match(/(?:^|\\s)size-(\\d+(?:\\.5)?)(?:\\s|$)/);
  const hMatch = className.match(/(?:^|\\s)h-(\\d+(?:\\.5)?)(?:\\s|$)/);
  const wMatch = className.match(/(?:^|\\s)w-(\\d+(?:\\.5)?)(?:\\s|$)/);

  const token =
    (sizeMatch?.[1] ?? hMatch?.[1] ?? wMatch?.[1]) !== undefined
      ? Number(sizeMatch?.[1] ?? hMatch?.[1] ?? wMatch?.[1])
      : undefined;
  if (!token || Number.isNaN(token)) return undefined;
  return token * TAILWIND_STEP_PX;
}

function deriveColorFromClassName(className?: string): string | undefined {
  if (!className) return undefined;

  if (/(?:^|\\s)text-white(?:\\s|$)/.test(className))
    return tokenColor("neutral.50");
  if (/(?:^|\\s)text-black(?:\\s|$)/.test(className))
    return tokenColor("neutral.900");
  if (/(?:^|\\s)text-brand-accent(?:\\s|$)/.test(className))
    return tokenColor("brand.accent");
  if (/(?:^|\\s)text-brand-secondary(?:\\s|$)/.test(className))
    return tokenColor("brand.secondary");
  if (/(?:^|\\s)text-brand-primary(?:\\s|$)/.test(className))
    return tokenColor("brand.primary");

  const neutralMatch = className.match(
    /(?:^|\\s)text-(?:gray|neutral)-(\\d{2,3})(?:\\s|$)/,
  );
  if (neutralMatch?.[1]) {
    const shade = neutralMatch[1];
    return tokenColor(`neutral.${shade}`);
  }

  const roseMatch = className.match(/(?:^|\\s)text-rose-(\\d{2,3})(?:\\s|$)/);
  if (roseMatch?.[1]) {
    const shade = Number(roseMatch[1]);
    if (shade <= 100) return tokenColor("rose.100");
    if (shade >= 800) return tokenColor("rose.800");
    return tokenColor("rose.DEFAULT");
  }

  const greenMatch = className.match(
    /(?:^|\\s)text-(?:green|emerald)-(\\d{2,3})(?:\\s|$)/,
  );
  if (greenMatch?.[1]) {
    const shade = greenMatch[1];
    return tokenColor(`green.${shade}`);
  }

  const yellowMatch = className.match(
    /(?:^|\\s)text-(?:yellow|amber)-(\\d{2,3})(?:\\s|$)/,
  );
  if (yellowMatch?.[1]) {
    const shade = Number(yellowMatch[1]);
    if (shade >= 800) return tokenColor("yellow.800");
    if (shade >= 700) return tokenColor("yellow.700");
    return tokenColor("yellow.DEFAULT");
  }

  const blueMatch = className.match(/(?:^|\\s)text-blue-(\\d{2,3})(?:\\s|$)/);
  if (blueMatch?.[1]) {
    const shade = blueMatch[1];
    return tokenColor(`blue.${shade}`);
  }

  return undefined;
}

export type IconProps = {
  name: IconName;
  /**
   * Web-only, but accepted so shared code can pass `className` without breaking RN.
   * Used to derive `size` and `color` when those props aren't provided.
   */
  className?: string;
  size?: number;
  color?: string;
  /** When set (e.g. for star ratings), forwarded to the underlying SVG icon. */
  fill?: string;
  strokeWidth?: number;
  testID?: string;
  accessibilityLabel?: string;
};

export function Icon({
  name,
  className,
  size,
  color,
  fill,
  strokeWidth,
  testID,
  accessibilityLabel,
}: IconProps): JSX.Element | null {
  const IconComponent = getIcon(name);
  const derivedSize = useMemo(
    () => deriveSizeFromClassName(className),
    [className],
  );
  const derivedColor = useMemo(
    () => deriveColorFromClassName(className),
    [className],
  );

  if (!IconComponent) return null;

  const resolvedSize = size ?? derivedSize ?? 24;
  const resolvedColor = color ?? derivedColor ?? tokenColor("neutral.700");

  return (
    <IconComponent
      width={resolvedSize}
      height={resolvedSize}
      // lucide-react-native uses react-native-svg under the hood
      color={resolvedColor}
      fill={fill}
      strokeWidth={strokeWidth}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
