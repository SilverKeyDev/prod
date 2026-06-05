import { Box } from "packages/ui/components/structure/primitives";
import { sidebarInsetHeaderGhostButtonClass } from "packages/ui/components/structure/sidebar/sidebarTheme";

import { BodyText, Button } from "@/components/ui";

export function ConnectionRequestsHeaderButton({
  onClick,
  label,
  pendingCount,
}: {
  onClick: () => void;
  label: string;
  pendingCount: number;
}) {
  return (
    <Box className="relative shrink-0">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className={sidebarInsetHeaderGhostButtonClass()}
        label={label}
        iconName="inbox"
      >
        <BodyText as="span" size="sm" className="text-text-secondary">
          {label}
        </BodyText>
      </Button>
      {pendingCount > 0 ? (
        <Box
          className="bg-destructive absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs font-semibold leading-none text-white"
          aria-hidden
        >
          {pendingCount > 9 ? "9+" : String(pendingCount)}
        </Box>
      ) : null}
    </Box>
  );
}
