import { useState, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselProps<T> {
  /**
   * Array of items to display in the carousel
   */
  items: T[];
  /**
   * Number of items to show per page
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
  title: string;
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
  itemWidth = "w-80"
}: CarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Navigation logic
  const canGoToPrevious = currentIndex > 0;
  const canGoToNext = currentIndex + itemsPerPage < items.length;

  const goToPrevious = () => {
    if (canGoToPrevious) {
      setCurrentIndex(Math.max(0, currentIndex - itemsPerPage));
    }
  };

  const goToNext = () => {
    if (canGoToNext) {
      setCurrentIndex(Math.min(items.length - itemsPerPage, currentIndex + itemsPerPage));
    }
  };

  const visibleItems = items.slice(currentIndex, currentIndex + itemsPerPage);

  return (
    <div className="my-8">
      {/* Header with title and navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {items.length > itemsPerPage && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {currentIndex + 1}-{Math.min(currentIndex + itemsPerPage, items.length)} of {items.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={goToPrevious}
                disabled={!canGoToPrevious}
                className={`p-2 rounded-full border transition ${
                  canGoToPrevious
                    ? 'border-brown text-brown hover:bg-brown hover:text-white'
                    : 'border-gray-300 text-gray-300 cursor-not-allowed'
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={goToNext}
                disabled={!canGoToNext}
                className={`p-2 rounded-full border transition ${
                  canGoToNext
                    ? 'border-brown text-brown hover:bg-brown hover:text-white'
                    : 'border-gray-300 text-gray-300 cursor-not-allowed'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-gray-500">{emptyMessage}</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">{emptyMessage}</p>
      ) : (
        <div className="flex gap-6 overflow-hidden">
          {visibleItems.map((item, index) => (
            <div key={getItemKey(item, currentIndex + index)} className={`flex-shrink-0 ${itemWidth}`}>
              {renderItem(item, currentIndex + index)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
