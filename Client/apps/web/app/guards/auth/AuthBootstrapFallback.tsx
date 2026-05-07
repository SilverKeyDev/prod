import { Box, Text } from "packages/ui/components/primitives";

function PulseBar({ className }: { className?: string }) {
  return (
    <Box className={`bg-muted/60 dark:bg-muted/40 animate-pulse rounded-md ${className ?? ""}`} />
  );
}

/**
 * Full-viewport shell while auth bootstrap runs on protected routes.
 * Avoids a blank screen and exposes status for assistive tech.
 */
export function AuthBootstrapFallback() {
  return (
    <Box
      className="flex min-h-dvh min-w-0 flex-col items-center justify-center bg-background-base px-4"
      role="status"
      aria-busy="true"
    >
      <Text className="sr-only">Loading…</Text>
      <Box className="flex w-full max-w-sm flex-col gap-4">
        <PulseBar className="h-10 w-3/5 self-center" />
        <PulseBar className="h-32 w-full rounded-xl" />
        <PulseBar className="h-24 w-4/5 self-center rounded-xl" />
      </Box>
    </Box>
  );
}
