import { Box } from "packages/ui/components/primitives";

import type { DashboardAreaKey } from "./useDashboardRoute";

export type DashboardRouteFallbackVariant = DashboardAreaKey | "generic";

type DashboardRouteFallbackProps = {
  variant: DashboardRouteFallbackVariant;
};

function PulseBar({ className }: { className?: string }) {
  return (
    <Box className={`animate-pulse rounded-md bg-muted/60 dark:bg-muted/40 ${className ?? ""}`} />
  );
}

export function DashboardRouteFallback({ variant }: DashboardRouteFallbackProps) {
  if (variant === "messaging") {
    return (
      <Box className="flex min-h-[240px] w-full flex-1 gap-3 p-4 md:min-h-[320px] md:p-6">
        <Box className="hidden w-[38%] max-w-[320px] shrink-0 flex-col gap-3 md:flex">
          <PulseBar className="h-9 w-full" />
          <PulseBar className="h-12 w-full" />
          <PulseBar className="h-12 w-full" />
          <PulseBar className="h-12 w-full" />
        </Box>
        <Box className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 rounded-lg border border-border-base bg-background-elevated/40 p-4">
          <PulseBar className="h-10 w-48" />
          <PulseBar className="min-h-[120px] flex-1 w-full" />
          <PulseBar className="h-14 w-full max-w-3xl self-center" />
        </Box>
      </Box>
    );
  }

  if (variant === "search") {
    return (
      <Box className="flex min-h-[200px] w-full flex-1 flex-col gap-3 p-4 md:p-6">
        <PulseBar className="h-12 w-full max-w-xl" />
        <PulseBar className="min-h-[280px] flex-1 w-full rounded-lg" />
      </Box>
    );
  }

  if (variant === "dashboard") {
    return (
      <Box className="flex w-full flex-col gap-6 py-4 md:py-6">
        <PulseBar className="h-36 w-full rounded-xl" />
        <PulseBar className="h-28 w-full rounded-xl md:w-4/5" />
        <PulseBar className="h-64 w-full rounded-xl" />
      </Box>
    );
  }

  return (
    <Box className="flex min-h-[200px] w-full flex-col gap-4 px-4 py-8 md:px-0">
      <PulseBar className="h-10 w-56" />
      <PulseBar className="h-32 w-full rounded-xl" />
      <PulseBar className="h-48 w-full rounded-xl md:w-5/6" />
    </Box>
  );
}
