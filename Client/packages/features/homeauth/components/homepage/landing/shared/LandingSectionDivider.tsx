import { Box } from "packages/ui/components/structure/primitives";

/** Thin horizontal rule between landing sections. */
export function LandingSectionDivider() {
  return (
    <Box className="px-responsive-sm py-6 sm:py-8" aria-hidden>
      <Box className="via-border-card-subtle/70 mx-auto h-px w-full max-w-4xl bg-gradient-to-r from-transparent to-transparent" />
    </Box>
  );
}
