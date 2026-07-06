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
      <BodyText
        size="xs"
        className="text-text-secondary font-medium uppercase tracking-wide"
      >
        {label}
      </BodyText>
      <Box className="flex flex-row flex-wrap gap-2">
        {filtered.map((item) => (
          <PublicProfileChip key={item}>{item}</PublicProfileChip>
        ))}
      </Box>
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
