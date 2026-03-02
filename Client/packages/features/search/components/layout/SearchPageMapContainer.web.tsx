import type { RefObject } from "react";

import { RippleBackground } from "packages/features/homeauth";
import { MapControls } from "packages/features/search/components/map/MapControls.web";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";

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
    <div className={containerClassName}>
      {isLoading && (
        <div
          className={`absolute inset-0 z-20 flex h-full w-full items-center justify-center overflow-hidden ${loadingOverlayClassName}`}
        >
          <div className="absolute inset-0 z-0">
            <RippleBackground />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-4">
            {showLoadingWrapper ? (
              <div className="rounded-full bg-white px-6 py-3 shadow-md">
                <KeyTurnLoader message={loadingMessage} variant={loadingVariant} />
              </div>
            ) : (
              <div className="gap-responsive-sm flex flex-col items-center">
                <KeyTurnLoader message={loadingMessage} variant={loadingVariant} />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative h-full w-full">
        <div ref={mapRef} className={mapClassName} style={{ minHeight: mapMinHeight }} />

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
      </div>
    </div>
  );
}
