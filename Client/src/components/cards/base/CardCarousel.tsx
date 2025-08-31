import { useState, ReactNode, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Loading } from "../../ui";

export interface CardCarouselProps<T> {
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
   * Card sizing strategy
   */
  cardSizing?: 'fixed' | 'responsive' | 'fill';
  /**
   * Minimum card width in pixels (for responsive/fill modes)
   */
  minCardWidth?: number;
  /**
   * Maximum card width in pixels (for responsive/fill modes)
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
  itemsPerPage = 3,
  renderItem,
  getItemKey,
  loading = false,
  error = null,
  emptyMessage = "No items to display",
  cardSizing = 'responsive',
  minCardWidth = 280,
  maxCardWidth = 400,
  cardGap = 16,
  showDots = true,
  embeddedButton
}: CardCarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [calculatedItemsPerPage, setCalculatedItemsPerPage] = useState(itemsPerPage);
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
      
      if (cardSizing === 'fixed') {
        setCalculatedItemsPerPage(itemsPerPage);
        return;
      }
      
      // Calculate optimal number of items based on container width
      const totalGapWidth = (itemsPerPage - 1) * cardGap;
      const availableCardWidth = availableWidth - totalGapWidth;
      
      if (cardSizing === 'fill') {
        // Fill mode: use all available space, always fill the container width
        const maxPossibleItems = Math.min(items.length, itemsPerPage);
        const idealCardWidth = availableCardWidth / maxPossibleItems;
        
        if (idealCardWidth >= minCardWidth) {
          // Use the maximum items that fit, up to itemsPerPage or total items
          setCalculatedItemsPerPage(maxPossibleItems);
        } else {
          // Reduce items to maintain minimum width
          const maxItems = Math.floor((availableWidth + cardGap) / (minCardWidth + cardGap));
          setCalculatedItemsPerPage(Math.max(1, Math.min(maxItems, items.length)));
        }
      } else {
        // Responsive mode: find optimal balance
        const idealCardWidth = (availableCardWidth) / itemsPerPage;
        if (idealCardWidth < minCardWidth) {
          const maxItems = Math.floor((availableWidth + cardGap) / (minCardWidth + cardGap));
          setCalculatedItemsPerPage(Math.max(1, maxItems));
        } else {
          setCalculatedItemsPerPage(itemsPerPage);
        }
      }
    };
    
    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);
    
    return () => window.removeEventListener('resize', calculateDimensions);
  }, [cardSizing, itemsPerPage, minCardWidth, maxCardWidth, cardGap, items.length]);

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
  
  // Calculate card width based on container and sizing strategy
  const getCardWidth = () => {
    if (isMobile) return 'w-[80%]';
    
    if (cardSizing === 'fixed') {
      return 'w-80'; // Fixed 320px width
    }
    
    if (!containerWidth) return 'w-80';
    
    const totalGapWidth = (effectiveItemsPerPage - 1) * cardGap;
    const availableCardWidth = containerWidth - totalGapWidth;
    const cardWidth = Math.floor(availableCardWidth / effectiveItemsPerPage);
    
    // Ensure consistent width within min/max bounds
    const constrainedWidth = Math.max(minCardWidth, Math.min(maxCardWidth || cardWidth, cardWidth));
    
    return constrainedWidth;
  };
  
  const cardWidthClass = getCardWidth();

  return (
    <div className="my-4 sm:my-6 md:my-8" ref={containerRef}>
      {/* Header with embedded button on left and navigation on right */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 w-full min-w-0">
        {/* Left side: Embedded button */}
        <div className="flex items-center h-10">
          {embeddedButton}
        </div>
        
        {/* Right side: Navigation controls */}
        {items.length > effectiveItemsPerPage && (
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
          {/* Desktop: calculated width layout */}
          <div 
            className={`${isMobile ? 'hidden' : 'flex overflow-x-auto scrollbar-hide pb-2'}`} 
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
                  className="flex-shrink-0"
                  style={{
                    width: typeof cardWidthClass === 'number' ? `${cardWidthClass}px` : undefined,
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