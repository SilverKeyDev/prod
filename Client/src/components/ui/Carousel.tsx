import { useState, ReactNode, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import KeyTurnLoader from "./KeyTurnLoader";

interface CarouselProps<T> {
  /**
   * Array of items to display in the carousel
   */
  items: T[];
  /**
   * Number of items to show per page (desktop)
   */
  itemsPerPage?: number;
  /**
   * Function to render each item
   */
  renderItem: (item: T, index: number) => ReactNode;
  /**
   * Function to get unique key for each item
   */
  getItemKey: (item: T, index: number) => string;
  /**
   * Title for the carousel section
   */
  title: string | ReactNode;
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Error state
   */
  error?: string | null;
  /**
   * Empty state message
   */
  emptyMessage?: string;
  /**
   * Custom width for each item (default: w-80)
   */
  itemWidth?: string;
  /**
   * Show dots indicator on mobile
   */
  showDots?: boolean;
}

/**
 * Reusable carousel component for displaying items in a horizontal scrolling layout
 * with navigation arrows and pagination info.
 */
export default function Carousel<T>({
  items,
  itemsPerPage = 3,
  renderItem,
  getItemKey,
  title,
  loading = false,
  error = null,
  emptyMessage = "No items to display",
  itemWidth = "w-80",
  showDots = true
}: CarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use 1 item per page on mobile, otherwise use the provided itemsPerPage
  const effectiveItemsPerPage = isMobile ? 1 : itemsPerPage;

  // Navigation logic
  const canGoToPrevious = currentIndex > 0;
  const canGoToNext = currentIndex + effectiveItemsPerPage < items.length;

  const goToPrevious = () => {
    if (canGoToPrevious) {
      setCurrentIndex(Math.max(0, currentIndex - effectiveItemsPerPage));
    }
  };

  const goToNext = () => {
    if (canGoToNext) {
      setCurrentIndex(Math.min(items.length - effectiveItemsPerPage, currentIndex + effectiveItemsPerPage));
    }
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  const visibleItems = items.slice(currentIndex, currentIndex + effectiveItemsPerPage);

  return (
    <div className="my-4 sm:my-6 md:my-8">
      {/* Header with title and navigation */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        {typeof title === 'string' ? (
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">{title}</h2>
        ) : (
          <div>{title}</div>
        )}
        {items.length > effectiveItemsPerPage && (
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm text-gray-500 hidden sm:block">
              {isMobile ? `${currentIndex + 1} of ${items.length}` : `${currentIndex + 1}-${Math.min(currentIndex + effectiveItemsPerPage, items.length)} of ${items.length}`}
            </span>
            <div className="flex gap-1">
              <button
                onClick={goToPrevious}
                disabled={!canGoToPrevious}
                className={`p-1.5 sm:p-2 rounded-full border transition touch-manipulation ${
                  canGoToPrevious
                    ? 'border-brown text-brown hover:bg-brown hover:text-white active:scale-95'
                    : 'border-gray-300 text-gray-300 cursor-not-allowed'
                }`}
              >
                <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={goToNext}
                disabled={!canGoToNext}
                className={`p-1.5 sm:p-2 rounded-full border transition touch-manipulation ${
                  canGoToNext
                    ? 'border-brown text-brown hover:bg-brown hover:text-white active:scale-95'
                    : 'border-gray-300 text-gray-300 cursor-not-allowed'
                }`}
              >
                <ChevronRight size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-6 sm:py-8">
          <KeyTurnLoader message="Loading..." />
        </div>
      ) : error ? (
        <p className="text-sm sm:text-base text-gray-500 text-center py-4">{emptyMessage}</p>
      ) : items.length === 0 ? (
        <p className="text-sm sm:text-base text-gray-500 text-center py-4">{emptyMessage}</p>
      ) : (
        <div className="relative">
          {/* Desktop: horizontal scroll layout */}
          <div className={`${isMobile ? 'hidden' : 'flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2'}`} style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            {visibleItems.map((item, index) => (
              <div key={getItemKey(item, currentIndex + index)} className={`flex-shrink-0 ${itemWidth.replace('w-80', 'w-64 sm:w-72 md:w-80')}`}>
                {renderItem(item, currentIndex + index)}
              </div>
            ))}
          </div>

          {/* Mobile: single item with overlay navigation */}
          <div className={`${isMobile ? 'block' : 'hidden'} relative`}>
            <div className="w-full">
              {renderItem(visibleItems[0], currentIndex)}
            </div>

            {/* Mobile navigation arrows - overlay style */}
            {items.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  disabled={!canGoToPrevious}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-lg border transition touch-manipulation z-10 ${
                    canGoToPrevious
                      ? 'border-brown text-brown hover:bg-brown hover:text-white active:scale-95'
                      : 'border-gray-300 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={goToNext}
                  disabled={!canGoToNext}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-lg border transition touch-manipulation z-10 ${
                    canGoToNext
                      ? 'border-brown text-brown hover:bg-brown hover:text-white active:scale-95'
                      : 'border-gray-300 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Mobile dot indicators */}
            {showDots && items.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {items.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToIndex(index)}
                    className={`w-2 h-2 rounded-full transition touch-manipulation ${
                      index === currentIndex
                        ? 'bg-brown'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
