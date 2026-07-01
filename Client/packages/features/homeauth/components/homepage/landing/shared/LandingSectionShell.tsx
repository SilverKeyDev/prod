import type { ReactNode } from "react";

import { Box } from "packages/ui/components/structure/primitives";

type LandingSectionShellProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  narrow?: boolean;
};

export function LandingSectionShell({
  id,
  children,
  className = "",
  narrow = true,
}: LandingSectionShellProps) {
  const maxWidth = narrow ? "max-w-[680px]" : "max-w-[880px]";
  return (
    <section id={id} className={`px-responsive-sm lg:py-22 py-16 sm:py-20 ${className}`}>
      <Box className={`mx-auto w-full ${maxWidth}`}>{children}</Box>
    </section>
  );
}
