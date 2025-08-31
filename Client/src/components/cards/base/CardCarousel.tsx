import { useState, ReactNode, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Loading } from "../../ui";

export interface CardCarouselProps<T> {
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
   * Minimum card width in pixels - determines how many cards fit
   */
  minCardWidth?: number;
  /**
   * Maximum card width in pixels - limits card expansion
   */
  maxCardWidth?: number;
  /**
   * Gap between cards in pixels
   */
  cardGap?: number;
  /**
   * Show dots indicator on mobile
   */
  showDots?: boolean;
  /**
   * Optional embedded button to display alongside navigation buttons
   */
  embeddedButton?: ReactNode;
}

/**
 * Reusable carousel component for displaying items in a horizontal scrolling layout
 * with navigation arrows and pagination info.
 */
export default function CardCarousel<T>({
  items,
  renderItem,
  getItemKey,
  loading = false,
  error = null,
  emptyMessage = "No items to display",
  minCardWidth = 280,
  maxCardWidth = 400,
  cardGap = 16,
  showDots = true,
  embeddedButton
}: CardCarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [, setContainerWidth] = useState(0);
  const [calculatedItemsPerPage, setCalculatedItemsPerPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate optimal card sizing based on container width
  useEffect(() => {
    const calculateDimensions = () => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const availableWidth = containerRect.width;
      setContainerWidth(availableWidth);
      
      const isMobileScreen = window.innerWidth < 768;
      setIsMobile(isMobileScreen);
      
      if (isMobileScreen) {
        setCalculatedItemsPerPage(1);
        return;
      }
      
      // Calculate how many cards can fit based on container width and card constraints
      // Always try to fit as many cards as possible within the available space
      const maxItems = Math.floor((availableWidth + cardGap) / (minCardWidth + cardGap));
      const optimalItemsPerPage = Math.max(1, Math.min(maxItems, items.length));
      
      setCalculatedItemsPerPage(optimalItemsPerPage);
    };
    
    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);
    
    return () => window.removeEventListener('resize', calculateDimensions);
  }, [minCardWidth, cardGap, items.length]);

  // Use calculated items per page
  const effectiveItemsPerPage = calculatedItemsPerPage;

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
    <div className="my-4 sm:my-6 md:my-8" ref={containerRef}>
      {/* Header with embedded button on left and navigation on right */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 w-full min-w-0">
        {/* Left side: Embedded button */}
        <div className="flex items-center h-10">
          {embeddedButton}
        </div>
        
        {/* Right side: Navigation controls - Always show arrows */}
        {items.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevious}
              disabled={!canGoToPrevious}
              className={`p-2 h-8 w-8 rounded-lg transition-all duration-200 ease-out touch-manipulation flex items-center justify-center ${
                canGoToPrevious
                  ? 'bg-brown/5 text-brown hover:bg-brown hover:text-white shadow-sm hover:shadow-md'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNext}
              disabled={!canGoToNext}
              className={`p-2 h-8 w-8 rounded-lg transition-all duration-200 ease-out touch-manipulation flex items-center justify-center ${
                canGoToNext
                  ? 'bg-brown/5 text-brown hover:bg-brown hover:text-white shadow-sm hover:shadow-md'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-6 sm:py-8">
          <Loading message="Loading..." />
        </div>
      ) : error ? (
        <p className="text-responsive-sm text-neutral-500 text-center py-4">{emptyMessage}</p>
      ) : items.length === 0 ? (
        <p className="text-responsive-sm text-neutral-500 text-center py-4">{emptyMessage}</p>
      ) : (
        <div className="relative">
          {/* Desktop: full width layout with proper alignment */}
          <div 
            className={`${isMobile ? 'hidden' : 'flex pb-2'}`} 
            style={{
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              gap: `${cardGap}px`
            }}
          >
            {visibleItems.map((item, index) => {
              return (
                <div 
                  key={getItemKey(item, currentIndex + index)} 
                  className="flex-1 min-w-0"
                  style={{
                    minWidth: `${minCardWidth}px`,
                    maxWidth: maxCardWidth ? `${maxCardWidth}px` : undefined
                  }}
                >
                  {renderItem(item, currentIndex + index)}
                </div>
              );
            })}
          </div>

          {/* Mobile: single item with overlay navigation */}
          <div className={`${isMobile ? 'block' : 'hidden'} relative`}>
            <div className="w-[80%] mx-auto">
              {renderItem(visibleItems[0], currentIndex)}
            </div>

            {/* Mobile navigation arrows - overlay style */}
            {items.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  disabled={!canGoToPrevious}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg backdrop-blur-sm shadow-lg transition-all duration-200 ease-out touch-manipulation z-10 ${
                    canGoToPrevious
                      ? 'bg-white/90 text-brown hover:bg-brown hover:text-white shadow-md hover:shadow-lg'
                      : 'bg-white/60 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToNext}
                  disabled={!canGoToNext}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg backdrop-blur-sm shadow-lg transition-all duration-200 ease-out touch-manipulation z-10 ${
                    canGoToNext
                      ? 'bg-white/90 text-brown hover:bg-brown hover:text-white shadow-md hover:shadow-lg'
                      : 'bg-white/60 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Mobile dot indicators */}
            {showDots && items.length > 1 && (
              <div className="flex justify-center gap-responsive-xs mt-4">
                {items.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToIndex(index)}
                    className={`w-2 h-2 rounded-full transition touch-manipulation ${
                      index === currentIndex
                        ? 'bg-brand-accent'
                        : 'bg-neutral-300 hover:bg-neutral-400'
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