import React, { useCallback, useState } from "react";

import { useLocalization } from "packages/contexts";
import {
  SEARCH_HEADER_PANEL_CLASS_DEFAULT,
  SEARCH_HEADER_PANEL_MAX_HEIGHT,
} from "packages/features/search/components/header/searchHeaderConstants";
import { useRegisterSearchHeaderPopoverWhenOpen } from "packages/features/search/hooks/ui/popovers/searchHeaderPopoverDismiss.web";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/domain/translations";
import { Box } from "packages/ui/components/structure/primitives";
import { HEADER_ROW_CONTROL_HEIGHT } from "packages/ui/constants/layout";
import { TOUR_TARGETS_DESKTOP } from "packages/utils/transaction/tour/tourTargets";

import { BodyText, Button, DropdownChevron, Popover } from "@/components/ui";

import { SearchDisplayPanelWeb } from "./SearchDisplayPanel.web";

const panelClass = `${SEARCH_HEADER_PANEL_CLASS_DEFAULT} overflow-x-hidden`;

const buttonBase = `inline-flex items-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-colors whitespace-nowrap shrink-0 justify-between ${HEADER_ROW_CONTROL_HEIGHT}`;

export default function SearchDisplayDropdown(): React.ReactElement {
  const { t } = useLocalization();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useRegisterSearchHeaderPopoverWhenOpen(open, close);

  const displayLabel = t("search.display") ?? SEARCH_TRANSLATIONS["search.display"] ?? "Display";

  return (
    <Box id={TOUR_TARGETS_DESKTOP.displayControl} className="inline-flex shrink-0">
      <Popover
        open={open}
        onOpenChange={setOpen}
        usePortal
        side="left"
        panelClassName={panelClass}
        panelMaxHeight={SEARCH_HEADER_PANEL_MAX_HEIGHT}
        panelMinWidth="320px"
        trigger={({ open: isActive, onToggle }) => (
          <Button
            type="button"
            onClick={onToggle}
            variant={isActive ? "outline" : "secondary"}
            size="sm"
            rounded="lg"
            className={buttonBase}
            aria-expanded={isActive}
            aria-haspopup="true"
            iconName="grid-3x3"
            label={displayLabel}
          >
            <Box className="flex w-full items-center justify-between gap-2">
              <BodyText as="span" size="sm" className="text-inherit">
                {displayLabel}
              </BodyText>
              <DropdownChevron open={isActive} className="h-4 w-4" />
            </Box>
          </Button>
        )}
      >
        {({ registerOutsideClickSafeTarget }) => (
          <SearchDisplayPanelWeb registerOutsideClickSafeTarget={registerOutsideClickSafeTarget} />
        )}
      </Popover>
    </Box>
  );
}
