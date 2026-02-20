import React from "react";

import {
  BodyText,
  Button,
  DropdownChevron,
  Popover,
} from "@/components/ui/index.web";

const CHIP_HEIGHT = "h-11";
const chipBase =
  "inline-flex touch-friendly shrink-0 items-center gap-1.5 rounded-lg border px-3 text-left text-sm font-medium transition-colors whitespace-nowrap " +
  CHIP_HEIGHT;

export type SearchFilterChipProps = {
  /** Short label (e.g. "Price") */
  label: string;
  /** Summary text (e.g. "$925K – $1.5M") */
  summary: string;
  /** Panel content; receives onClose */
  children: (props: { onClose: () => void }) => React.ReactNode;
  /** Panel container class (e.g. scrollbar-styled p-4 w-[...]) */
  panelClassName?: string;
  panelMaxHeight?: string;
  panelMinWidth?: string;
  /** Popover side */
  side?: "left" | "bottom";
};

export default function SearchFilterChip({
  label,
  summary,
  children,
  panelClassName = "scrollbar-styled p-4 w-[min(90vw,420px)] max-h-[85vh] overflow-y-auto",
  panelMaxHeight = "85vh",
  panelMinWidth = "320px",
  side = "bottom",
}: SearchFilterChipProps): React.ReactElement {
  return (
    <Popover
      usePortal
      side={side}
      panelClassName={panelClassName}
      panelMaxHeight={panelMaxHeight}
      panelMinWidth={panelMinWidth}
      trigger={({ open: isActive, onToggle }) => (
        <Button
          type="button"
          onClick={onToggle}
          variant={isActive ? "outline" : "secondary"}
          size="sm"
          rounded="lg"
          className={chipBase}
          aria-expanded={isActive}
          aria-haspopup="true"
        >
          <div className="flex min-w-0 flex-col items-start gap-0">
            <BodyText size="xs" className="text-inherit opacity-90">
              {label}
            </BodyText>
            <BodyText size="sm" className="truncate font-medium">
              {summary}
            </BodyText>
          </div>
          <DropdownChevron open={isActive} className="h-4 w-4 shrink-0" />
        </Button>
      )}
    >
      {children}
    </Popover>
  );
}
