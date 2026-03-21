import React from "react";

import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

import { BodyText, Button, DropdownChevron, Popover } from "@/components/ui";

import {
  SEARCH_HEADER_PANEL_CLASS_DEFAULT,
  SEARCH_HEADER_PANEL_MAX_HEIGHT,
} from "./searchHeaderConstants";

const chipBase = `inline-flex touch-friendly shrink-0 items-center gap-1.5 rounded-lg border px-4 text-left text-sm font-medium transition-colors min-w-0 overflow-hidden ${HEADER_ROW_HEIGHT}`;

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
  panelClassName = SEARCH_HEADER_PANEL_CLASS_DEFAULT,
  panelMaxHeight = SEARCH_HEADER_PANEL_MAX_HEIGHT,
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
          <BodyText size="sm" className="min-w-0 truncate font-medium text-inherit">
            {label}: {summary}
          </BodyText>
          <DropdownChevron open={isActive} className="h-4 w-4 shrink-0" />
        </Button>
      )}
    >
      {children}
    </Popover>
  );
}
