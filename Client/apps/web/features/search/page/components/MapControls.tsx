import { ChevronLeft, ChevronRight } from "lucide-react";

export function MapControls(props: {
  variant: "mobile" | "desktop";
  page: number;
  total: number;
  perPage: number;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  disabled?: boolean;
}): JSX.Element {
  const {
    variant,
    page,
    total,
    perPage,
    onPrev,
    onNext,
    onZoomIn,
    onZoomOut,
    disabled = false,
  } = props;

  const showNavigation = total > perPage;
  const currentItem = Math.min((page + 1) * perPage, total);
  const isPrevDisabled = page === 0;
  const isNextDisabled = (page + 1) * perPage >= total;

  if (variant === "mobile") {
    return (
      <>
        {/* Mobile Zoom Controls */}
        <div className="gap-responsive-xs absolute bottom-4 left-4 z-10 flex flex-row">
          <button
            onClick={onZoomOut}
            disabled={disabled}
            className="mobile-icon-sm sm:mobile-icon-lg md:mobile-icon-xl touch-friendly cursor-zoom flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-md transition-all duration-200 hover:border-brown hover:text-brown hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:cursor-not-allowed disabled:opacity-50"
            title="Zoom out"
          >
            −
          </button>
          <button
            onClick={onZoomIn}
            disabled={disabled}
            className="mobile-icon-sm sm:mobile-icon-lg md:mobile-icon-xl touch-friendly cursor-zoom flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-md transition-all duration-200 hover:border-brown hover:text-brown hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:cursor-not-allowed disabled:opacity-50"
            title="Zoom in"
          >
            +
          </button>
        </div>

        {/* Mobile Property Navigation Controls */}
        {showNavigation && (
          <div className="gap-responsive-xs absolute bottom-4 right-4 z-10 flex flex-row">
            <button
              onClick={onPrev}
              disabled={isPrevDisabled || disabled}
              className="mobile-icon-sm sm:mobile-icon-lg md:mobile-icon-xl touch-friendly flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-md transition-all duration-200 hover:border-brown hover:text-brown hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:text-gray-700"
              title="Previous property"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            <div className="mobile-icon-sm sm:mobile-icon-lg md:mobile-icon-xl flex items-center justify-center rounded-lg border border-gray-300 bg-white px-2 text-xs font-medium text-gray-700 shadow-md sm:text-sm">
              {currentItem}/{total}
            </div>
            <button
              onClick={onNext}
              disabled={isNextDisabled || disabled}
              className="mobile-icon-sm sm:mobile-icon-lg md:mobile-icon-xl touch-friendly flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-md transition-all duration-200 hover:border-brown hover:text-brown hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:text-gray-700"
              title="Next property"
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        )}
      </>
    );
  }

  // Desktop version
  return (
    <>
      {/* Custom Zoom Controls */}
      <div className="absolute bottom-12 left-8 z-10 flex flex-row gap-1">
        <button
          onClick={onZoomOut}
          disabled={disabled}
          className="cursor-zoom flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-md transition-all duration-200 hover:border-brown hover:text-brown hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:cursor-not-allowed disabled:opacity-50 lg:h-10 lg:w-10"
          title="Zoom out"
        >
          −
        </button>
        <button
          onClick={onZoomIn}
          disabled={disabled}
          className="cursor-zoom flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-md transition-all duration-200 hover:border-brown hover:text-brown hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:cursor-not-allowed disabled:opacity-50 lg:h-10 lg:w-10"
          title="Zoom in"
        >
          +
        </button>
      </div>

      {/* Property Navigation Controls */}
      {showNavigation && (
        <div className="absolute bottom-12 right-8 z-10 flex flex-row gap-1">
          <button
            onClick={onPrev}
            disabled={isPrevDisabled || disabled}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-md transition-all duration-200 hover:border-brown hover:text-brown hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:text-gray-700 lg:h-8 lg:w-8"
            title="Previous properties"
          >
            <ChevronLeft className="h-3 w-3 lg:h-3 lg:w-3" />
          </button>
          <div className="flex h-8 w-auto items-center justify-center rounded-lg border border-gray-300 bg-white px-2 text-xs font-medium text-gray-700 shadow-md lg:h-8 lg:px-2 lg:text-xs">
            {currentItem} of {total}
          </div>
          <button
            onClick={onNext}
            disabled={isNextDisabled || disabled}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-md transition-all duration-200 hover:border-brown hover:text-brown hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:text-gray-700 lg:h-8 lg:w-8"
            title="Next properties"
          >
            <ChevronRight className="h-3 w-3 lg:h-3 lg:w-3" />
          </button>
        </div>
      )}
    </>
  );
}
