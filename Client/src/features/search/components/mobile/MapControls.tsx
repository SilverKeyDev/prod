import { ChevronLeft, ChevronRight } from "lucide-react";

export type MapControlsProps = {
  /** Control variant - mobile or desktop */
  variant: "mobile" | "desktop";
  /** Current page number */
  page: number;
  /** Total number of items */
  total: number;
  /** Items per page */
  perPage: number;
  /** Previous page handler */
  onPrev: () => void;
  /** Next page handler */
  onNext: () => void;
  /** Zoom in handler */
  onZoomIn: () => void;
  /** Zoom out handler */
  onZoomOut: () => void;
  /** Whether controls are disabled */
  disabled?: boolean;
};

export default function MapControls({
  variant,
  page,
  total,
  perPage,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  disabled = false,
}: MapControlsProps) {
  const totalPages = Math.ceil(total / perPage);
  const canGoPrev = page > 0 && !disabled;
  const canGoNext = page < totalPages - 1 && !disabled;

  if (variant === "mobile") {
    return (
      <>
        {/* Mobile Zoom Controls */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-responsive-xs z-30">
          <button
            onClick={onZoomIn}
            disabled={disabled}
            className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 touch-friendly cursor-zoom"
            title="Zoom in"
          >
            <span className="text-sm font-bold leading-none">+</span>
          </button>
          <button
            onClick={onZoomOut}
            disabled={disabled}
            className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 touch-friendly cursor-zoom"
            title="Zoom out"
          >
            <span className="text-sm font-bold leading-none">−</span>
          </button>
        </div>

        {/* Mobile Property Navigation Controls - ALWAYS VISIBLE */}
        <div className="absolute bottom-4 right-4 flex flex-row gap-responsive-xs z-30">
          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-700 disabled:hover:border-gray-300 touch-friendly"
            title="Previous property"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md flex items-center justify-center text-sm font-medium text-gray-700 px-2">
            {Math.min((page + 1) * perPage, total)}
            <span className="mx-1">/</span>
            {total}
          </div>
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-700 disabled:hover:border-gray-300 touch-friendly"
            title="Next property"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </>
    );
  }

  // Desktop variant
  return (
    <>
      {/* Custom Zoom Controls */}
      <div className="absolute bottom-12 left-8 flex flex-row gap-1 z-30">
        <button
          onClick={onZoomIn}
          disabled={disabled}
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 cursor-zoom"
          title="Zoom in"
        >
          <span className="text-sm font-bold leading-none">+</span>
        </button>
        <button
          onClick={onZoomOut}
          disabled={disabled}
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 cursor-zoom"
          title="Zoom out"
        >
          <span className="text-sm font-bold leading-none">−</span>
        </button>
      </div>

      {/* Property Navigation Controls - ALWAYS VISIBLE */}
      <div className="absolute bottom-12 right-8 flex flex-row gap-1 z-30">
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-700 disabled:hover:border-gray-300 cursor-pointer"
          title="Previous properties"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="w-auto px-3 h-10 bg-white border border-gray-300 rounded-lg shadow-md flex items-center justify-center text-sm font-medium text-gray-700">
          {Math.min((page + 1) * perPage, total)} of {total}
        </div>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-700 disabled:hover:border-gray-300 cursor-pointer"
          title="Next properties"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
