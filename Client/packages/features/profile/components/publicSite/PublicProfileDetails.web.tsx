import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

export const PUBLIC_PROFILE_CHIP_CLASS =
  "bg-background-base border-border rounded-full border px-3 py-1.5";

/** Rounded pill for short facts (specialties, licenses). */
export function PublicProfileChip({ children }: { children: string }) {
  return (
    <Box className={PUBLIC_PROFILE_CHIP_CLASS}>
      <BodyText size="xs">{children}</BodyText>
    </Box>
  );
}
