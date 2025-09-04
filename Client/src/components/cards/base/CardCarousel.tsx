import { useState, ReactNode, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Loading } from "../../ui";

export interface CardCarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getItemKey: (item: T, index: number) => string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  minCardWidth?: number;
  maxCardWidth?: number;
  cardGap?: number;
  showDots?: boolean;
  embeddedButton?: ReactNode;
}

/**
 * Carousel that:
 * - Never shows partial cards (full-page pagination)
 * - Cards stretch to fill space
 * - Slightly increased spacing between cards
 * - On load/resize, max card width = 90% of viewport width
 * - Cards are centered **only on mobile (<640px)**, never on desktop
 * - Amount of cards never increases if screensize decreases
 */
export default function CardCarousel<T>({
  items,
  renderItem,
  getItemKey,
  loading = false,
  error = null,
  emptyMessage = "No items to display",
  minCardWidth = 280,
  maxCardWidth = 0,
  cardGap = 16,
  showDots = true,
  embeddedButton,
}: CardCarouselProps<T>) {
  const MOBILE_BREAKPOINT_PX = 640;

  const [pageIndex, setPageIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [maxItemsPerPage, setMaxItemsPerPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const effectiveGap = Math.round(cardGap * 1.15);
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Keep page in bounds
  useEffect(() => {
    setPageIndex((prevPage) => Math.min(Math.max(0, prevPage), totalPages - 1));
  }, [totalPages]);

  // Calculate layout on mount and resize
  useEffect(() => {
    const calculateLayout = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const mobile = window.innerWidth < MOBILE_BREAKPOINT_PX;
      setIsMobile(mobile);

      if (mobile) {
        setItemsPerPage(1);
        return;
      }

      // Desktop: calculate how many cards can fit
      let maxFit = 1;
      for (let i = 1; i <= items.length; i++) {
        const totalGapWidth = effectiveGap * (i - 1);
        const requiredWidth = minCardWidth * i + totalGapWidth;
        if (requiredWidth <= containerWidth) {
          maxFit = i;
        } else {
          break;
        }
      }

      const newItemsPerPage = Math.max(1, Math.min(maxFit, items.length));
      
      // Prevent increasing items per page after initial calculation
      if (maxItemsPerPage === 1) {
        // First calculation
        setMaxItemsPerPage(newItemsPerPage);
        setItemsPerPage(newItemsPerPage);
      } else {
        // Subsequent calculations - can only stay same or decrease
        const finalItemsPerPage = Math.min(newItemsPerPage, maxItemsPerPage);
        setItemsPerPage(finalItemsPerPage);
      }
    };

    const handleResize = () => {
      setTimeout(calculateLayout, 100);
    };

    calculateLayout();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [items.length, minCardWidth, effectiveGap, maxItemsPerPage]);

  // Navigation
  const canGoPrev = pageIndex > 0 && !isAnimating;
  const canGoNext = pageIndex < totalPages - 1 && !isAnimating;

  const navigate = (newPage: number) => {
    if (isAnimating || newPage === pageIndex || newPage < 0 || newPage >= totalPages) return;
    
    setIsAnimating(true);
    setPageIndex(newPage);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const goPrev = () => canGoPrev && navigate(pageIndex - 1);
  const goNext = () => canGoNext && navigate(pageIndex + 1);
  const goToPage = (page: number) => navigate(page);

  // Create pages
  const pages = [];
  for (let i = 0; i < items.length; i += itemsPerPage) {
    pages.push(items.slice(i, i + itemsPerPage));
  }

  const viewportMaxWidth = typeof window !== "undefined" ? Math.floor(window.innerWidth * 0.9) : 400;
  const cardMaxWidth = maxCardWidth && maxCardWidth > 0 
    ? Math.min(maxCardWidth, viewportMaxWidth) 
    : viewportMaxWidth;

  return (
    <div className={`${isMobile ? 'my-0' : 'lg:my-4'} mx-4`} ref={containerRef}>
      {/* Header */}
      <div className={`flex items-center justify-between w-full min-w-0 ${isMobile ? 'mb-0' : 'mb-3 sm:mb-4'}`}>
        <div className="flex items-center h-10 text-responsive-sm whitespace-nowrap overflow-hidden">
          {embeddedButton}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            disabled={!canGoPrev}
            className={`p-2 h-8 w-8 rounded-lg transition-all duration-200 flex items-center justify-center ${
              canGoPrev
                ? "bg-brown/5 text-brown hover:bg-brown hover:text-white"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            } ${isAnimating ? "opacity-50" : ""}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goNext}
            disabled={!canGoNext}
            className={`p-2 h-8 w-8 rounded-lg transition-all duration-200 flex items-center justify-center ${
              canGoNext
                ? "bg-brown/5 text-brown hover:bg-brown hover:text-white"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            } ${isAnimating ? "opacity-50" : ""}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-6 sm:py-8">
          <Loading message="Loading..." />
        </div>
      ) : error ? (
        <p className="text-responsive-sm text-neutral-500 text-center py-4">
          {error}
        </p>
      ) : items.length === 0 ? (
        <p className="text-responsive-sm text-neutral-500 text-center py-4">
          {emptyMessage}
        </p>
      ) : (
        <div className="relative overflow-hidden">
          {/* Desktop */}
          {!isMobile && (
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(-${pageIndex * 100}%)`,
                }}
              >
                {pages.map((page, pIdx) => (
                  <div
                    key={`page-${pIdx}`}
                    className="w-full flex-shrink-0 flex"
                    style={{ gap: `${effectiveGap}px` }}
                  >
                    {page.map((item, idx) => {
                      const globalIndex = pIdx * itemsPerPage + idx;
                      const cardWidth = `calc((100% - ${effectiveGap * (page.length - 1)}px) / ${page.length})`;
                      return (
                        <div
                          key={getItemKey(item, globalIndex)}
                          className="flex-shrink-0"
                          style={{
                            width: cardWidth,
                            maxWidth: `${cardMaxWidth}px`,
                          }}
                        >
                          {renderItem(item, globalIndex)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile */}
          {isMobile && (
            <div>
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-300 ease-out"
                  style={{
                    transform: `translateX(-${pageIndex * 100}%)`,
                  }}
                >
                  {pages.map((page, pIdx) => (
                    <div
                      key={`mobile-page-${pIdx}`}
                      className="w-full flex-shrink-0 flex justify-center px-4"
                    >
                      {page[0] && (
                        <div 
                          className="w-full" 
                          style={{ maxWidth: `${cardMaxWidth}px` }}
                        >
                          {renderItem(page[0], pIdx * itemsPerPage)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {showDots && totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={`dot-${i}`}
                      onClick={() => goToPage(i)}
                      disabled={isAnimating}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        i === pageIndex
                          ? "bg-brand-accent scale-125"
                          : "bg-neutral-300 hover:bg-neutral-400"
                      } ${isAnimating ? "opacity-50" : ""}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}