import { useState, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import KeyTurnLoader from "./KeyTurnLoader";

interface MobileCarouselProps<T> {
  /**
   * Array of items to display in the carousel
   */
  items: T[];
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
   * Show dots indicator
   */
  showDots?: boolean;
}

/**
 * Mobile-optimized carousel component that displays one item at a time
 * with touch-friendly navigation and dot indicators.
 */
export default function MobileCarousel<T>({
  items,
  renderItem,
  title,
  loading = false,
  error = null,
  emptyMessage = "No items to display",
  showDots = true
}: MobileCarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Navigation logic
  const canGoToPrevious = currentIndex > 0;
  const canGoToNext = currentIndex < items.length - 1;

  const goToPrevious = () => {
    if (canGoToPrevious) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (canGoToNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="my-4">
      {/* Header with title */}
      <div className="flex items-center justify-between mb-3">
        {typeof title === 'string' ? (
          <h2 className="text-lg font-semibold">{title}</h2>
        ) : (
          <div>{title}</div>
        )}
        {items.length > 1 && (
          <span className="text-xs text-gray-500">
            {currentIndex + 1} of {items.length}
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-6">
          <KeyTurnLoader message="Loading..." />
        </div>
      ) : error ? (
        <p className="text-sm text-gray-500 text-center py-4">{emptyMessage}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">{emptyMessage}</p>
      ) : (
        <div className="relative">
          {/* Single item display */}
          <div className="w-full">
            {renderItem(items[currentIndex], currentIndex)}
          </div>

          {/* Navigation arrows - only show if more than 1 item */}
          {items.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                disabled={!canGoToPrevious}
                className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-md border transition touch-manipulation z-10 ${
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
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-md border transition touch-manipulation z-10 ${
                  canGoToNext
                    ? 'border-brown text-brown hover:bg-brown hover:text-white active:scale-95'
                    : 'border-gray-300 text-gray-300 cursor-not-allowed'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Dot indicators */}
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
      )}
    </div>
  );
}
