import type { ReactNode } from "react";

import type { IconName } from "packages/ui/components/media/icons";
import { Icon } from "packages/ui/components/media/icons";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

export const PUBLIC_PROFILE_CHIP_CLASS =
  "bg-background-base border-border rounded-full border px-3 py-1.5";

/** Rounded pill for short facts (specialties, zips, license chips). */
export function PublicProfileChip({ children }: { children: string }) {
  return (
    <Box className={PUBLIC_PROFILE_CHIP_CLASS}>
      <BodyText size="xs">{children}</BodyText>
    </Box>
  );
}

/** Labeled wrapping row of chips; renders nothing without items. */
export function PublicProfileChipRow({
  label,
  items,
}: {
  label: string;
  items: string[] | null | undefined;
}) {
  const filtered = items?.filter((item) => item?.trim()) ?? [];
  if (!filtered.length) return null;
  return (
    <Box className="gap-2">
      {label ? (
        <BodyText
          size="xs"
          className="text-text-secondary font-medium uppercase tracking-wide"
        >
          {label}
        </BodyText>
      ) : null}
      <Box className="flex flex-row flex-wrap gap-2">
        {filtered.map((item) => (
          <PublicProfileChip key={item}>{item}</PublicProfileChip>
        ))}
      </Box>
    </Box>
  );
}

/**
 * Icon-badged card in the landing info-card style. `surface` flips the card
 * background for sections with the base tone.
 */
export function PublicProfileInfoCard({
  iconName,
  title,
  surface = false,
  children,
  className = "",
}: {
  iconName: IconName;
  title: string;
  surface?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Box
      className={`border-border gap-4 rounded-2xl border p-5 shadow-sm hover:shadow-md motion-safe:transition-shadow sm:p-6 ${
        surface ? "bg-background-surface" : "bg-background-base"
      } ${className}`}
    >
      <Box className="flex flex-row items-center gap-3">
        <Box
          className={`border-border flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
            surface ? "bg-background-base" : "bg-background-surface"
          }`}
        >
          <Icon name={iconName} size={18} className="text-brand-primary" />
        </Box>
        <BodyText size="sm" className="text-text-primary font-semibold">
          {title}
        </BodyText>
      </Box>
      {children}
    </Box>
  );
}

/** Small label + value block; renders nothing without a value. */
export function PublicProfileDetail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value?.trim()) return null;
  return (
    <Box className="gap-1">
      <BodyText
        size="xs"
        className="text-text-secondary font-medium uppercase tracking-wide"
      >
        {label}
      </BodyText>
      <BodyText size="sm" className="text-text-primary">
        {value}
      </BodyText>
    </Box>
  );
}
