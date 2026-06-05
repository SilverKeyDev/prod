import type { ReactNode } from "react";

import { Box } from "packages/ui/components/structure/primitives";

export type AgendaListItemShellProps = {
  /** Tailwind classes for the left vertical strip (e.g. bg-accent w-1.5). */
  accentBarClassName: string;
  /** Main column: typically icon tile + text. */
  header: ReactNode;
  /** Optional actions block in the right column, beside the header (not below). */
  footer?: ReactNode;
};

/**
 * Shared chrome for Library list rows: rounded border, shadow, left accent bar.
 * Main content fills the left; optional actions sit in a right column (not below the header).
 */
export function AgendaListItemShell({
  accentBarClassName,
  header,
  footer,
}: AgendaListItemShellProps) {
  return (
    <Box className="border-border bg-background-surface hover:border-border-card-strong w-full max-w-full overflow-hidden rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
      <Box className="flex flex-row items-stretch">
        <Box className={`w-1.5 flex-shrink-0 ${accentBarClassName}`} />
        <Box className="flex min-h-0 min-w-0 flex-1 flex-row items-stretch">
          <Box className="flex min-w-0 shrink basis-2/3 flex-row items-start gap-3 p-3 sm:p-4">
            {header}
          </Box>
          {footer ? (
            <Box className="border-border-card-subtle flex min-w-0 shrink basis-1/3 flex-col items-stretch justify-center border-l px-2 py-3 sm:px-3 sm:py-4">
              {footer}
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
