import type { RefObject } from "react";

import { MapControls } from "packages/features/search/components/map/MapControls.web";
import KeyTurnLoader from "packages/ui/components/media/asset/loading/KeyTurnLoader.web";
import { Box } from "packages/ui/components/structure/primitives";
import { RippleBackground } from "packages/ui/components/surfaces/backgrounds";
type SearchPageMapContainerProps = {
  mapRef: RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  loadingMessage: string;
  loadingVariant?: "gray" | "default";
  showLoadingWrapper?: boolean;
  page: number;
  total: number;
  perPage: number;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  disabled: boolean;
  isSearching: boolean;
  containerClassName?: string;
  mapClassName?: string;
  mapMinHeight?: string;
  loadingOverlayClassName?: string;
};

export function SearchPageMapContainer({
  mapRef,
  isLoading,
  loadingMessage,
  loadingVariant = "gray",
  showLoadingWrapper = false,
  page,
  total,
  perPage,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  disabled,
  isSearching,
  containerClassName = "relative h-full w-full overflow-hidden rounded-t-2xl",
  mapClassName = "h-full w-full",
  mapMinHeight = "100%",
  loadingOverlayClassName = "rounded-t-2xl",
}: SearchPageMapContainerProps): JSX.Element {
  return (
    <Box className={containerClassName}>
      {isLoading && (
        <Box
          className={`z-dropdown absolute inset-0 flex h-full w-full items-center justify-center overflow-hidden ${loadingOverlayClassName}`}
        >
          <Box className="absolute inset-0 z-0">
            <RippleBackground />
          </Box>
          <Box className="z-dropdown relative flex flex-col items-center gap-4">
            {showLoadingWrapper ? (
              <Box className="bg-background-surface rounded-full px-6 py-3 shadow-md">
                <KeyTurnLoader message={loadingMessage} variant={loadingVariant} />
              </Box>
            ) : (
              <Box className="gap-responsive-sm flex flex-col items-center">
                <KeyTurnLoader message={loadingMessage} variant={loadingVariant} />
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Box className="relative h-full w-full">
        <Box ref={mapRef} className={mapClassName} style={{ minHeight: mapMinHeight }} />

        {!isSearching && (
          <MapControls
            page={page}
            total={total}
            perPage={perPage}
            onPrev={onPrev}
            onNext={onNext}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            disabled={disabled}
          />
        )}
      </Box>
    </Box>
  );
}
