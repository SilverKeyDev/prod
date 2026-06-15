import { useLocalization } from "packages/contexts";
import type { LibraryViewMode } from "packages/features/saved/hooks/ui/useLibraryViewMode";
import { Box } from "packages/ui/components/structure/primitives";
import { isNative } from "packages/utils/platform";

import { Button } from "@/components/ui";

type LibraryViewModeToggleProps = {
  viewMode: LibraryViewMode;
  onViewModeChange: (mode: LibraryViewMode) => void;
  /** When false, the control is not rendered (e.g. Forms Library has one layout). */
  visible?: boolean;
};

/**
 * Grid / list segmented control for Saved Library pages.
 * Styling matches the previous inline implementation in SavedLayout.
 */
export function LibraryViewModeToggle({
  viewMode,
  onViewModeChange,
  visible = true,
}: LibraryViewModeToggleProps) {
  const { t } = useLocalization();

  if (!visible) {
    return null;
  }

  const selectGrid = () => onViewModeChange("grid");
  const selectList = () => onViewModeChange("list");
  const pressProps = isNative
    ? { onPress: selectGrid }
    : { type: "button" as const, onClick: selectGrid, onPress: selectGrid };

  const pressPropsList = isNative
    ? { onPress: selectList }
    : { type: "button" as const, onClick: selectList, onPress: selectList };

  return (
    <Box className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      <Button
        {...pressProps}
        variant={viewMode === "grid" ? "primary" : "secondary"}
        size="sm"
        className={`touch-friendly rounded px-3 py-2.5 ${
          viewMode === "grid"
            ? "bg-primary hover:bg-primary text-white"
            : "bg-accent-muted hover:bg-accent-muted text-white"
        }`}
        label={t("saved.library_view_card")}
        accessibilityRole="button"
        accessibilityState={{ selected: viewMode === "grid" }}
      >
        <Box className="mobile-icon-xs grid grid-cols-2 gap-1" pointerEvents="none">
          <Box className="rounded-sm bg-current" />
          <Box className="rounded-sm bg-current" />
          <Box className="rounded-sm bg-current" />
          <Box className="rounded-sm bg-current" />
        </Box>
      </Button>
      <Button
        {...pressPropsList}
        variant={viewMode === "list" ? "primary" : "secondary"}
        size="sm"
        className={`touch-friendly rounded px-3 py-2.5 ${
          viewMode === "list"
            ? "bg-primary hover:bg-primary text-white"
            : "bg-accent-muted hover:bg-accent-muted text-white"
        }`}
        label={t("saved.library_view_list")}
        accessibilityRole="button"
        accessibilityState={{ selected: viewMode === "list" }}
      >
        <Box className="mobile-icon-xs space-y-1" pointerEvents="none">
          <Box className="h-0.5 rounded-sm bg-current" />
          <Box className="h-0.5 rounded-sm bg-current" />
          <Box className="h-0.5 rounded-sm bg-current" />
        </Box>
      </Button>
    </Box>
  );
}
