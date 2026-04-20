import {
  SEARCH_HEADER_PANEL_CLASS_DEFAULT,
  SEARCH_HEADER_PANEL_CLASS_HOME_TYPE,
} from "packages/features/search/components/header/searchHeaderConstants";
import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

export const searchFilterControlsPanelClass = SEARCH_HEADER_PANEL_CLASS_DEFAULT;

/** Hide horizontal scrollbar on stacked filter sections (sliders slightly wider than panel). */
export const searchFilterControlsMorePopoverPanelClass = `${SEARCH_HEADER_PANEL_CLASS_DEFAULT} overflow-x-hidden`;

export const searchFilterControlsHomeTypePanelClass = SEARCH_HEADER_PANEL_CLASS_HOME_TYPE;

export const searchFilterControlsButtonBase = `inline-flex items-center gap-1.5 rounded-lg border px-4 text-sm font-medium transition-colors whitespace-nowrap shrink-0 justify-between ${HEADER_ROW_HEIGHT}`;
