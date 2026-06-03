import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/styles.css";
import "./PropertyImageGallery.css";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@ui/icons";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

import { useLocalization } from "packages/contexts";
import type { PropertyImageGalleryProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { log } from "packages/logger";
import { Button } from "packages/ui";
import { StyledImage } from "packages/ui/components/cards/base";
import { Box } from "packages/ui/components/primitives";
import { getDocument, getWindow } from "packages/utils/platform";
import { getPropertyImages } from "packages/utils/propertyDetails";

import {
  PropertyImageGalleryEightGridPage,
  PropertyImageGalleryFirstPage,
} from "./PropertyImageGalleryLayouts";
import {
  CONTACT_SHEET_SIZE,
  FIRST_PAGE_IMAGE_COUNT,
  getPageForIndex,
  getPageStartForPage,
  getTotalPagesCount,
  OTHER_PAGE_IMAGE_COUNT,
} from "./propertyImageGalleryPagination";

const STICKY_PREVIEW_SIZE = 6;

export const PropertyImageGallery: React.FC<PropertyImageGalleryProps> = ({
  property,
  currentImageIndex,
  onImageChange,
  layout = "default",
  isLoading = false,
}) => {
  const { t } = useLocalization();
  const propertyImages = getPropertyImages(property);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [fullGalleryIndex, setFullGalleryIndex] = useState(currentImageIndex);
  const [isGridInView, setIsGridInView] = useState(true);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const galleryRootRef = useRef<HTMLDivElement | null>(null);
  const galleryScrollRef = useRef<HTMLDivElement | null>(null);
  const isFirstScrollSyncRef = useRef(true);

  useEffect(() => {
    const root = galleryRootRef.current;
    const grid = gridContainerRef.current;
    if (!root || !grid) return;
    const rootRect = root.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    const win = getWindow();
    log.debug("PAGES", "[Gallery] Dimension audit", {
      viewportWidth: win?.innerWidth,
      rootWidth: rootRect.width,
      rootLeft: rootRect.left,
      rootRight: rootRect.right,
      gridWidth: gridRect.width,
      gridLeft: gridRect.left,
      gridRight: gridRect.right,
      imageCount: propertyImages.length,
      layout,
      fullBleedGap: rootRect.left !== 0 ? `${rootRect.left}px from left edge` : "flush",
    });
  }, [propertyImages.length, layout]);

  const openFullGalleryAt = useCallback((index: number) => {
    setFullGalleryIndex(index);
    setShowFullGallery(true);
  }, []);

  const firstPageContactIndices = useMemo(() => {
    if (propertyImages.length <= 1) return [];
    return Array.from({ length: CONTACT_SHEET_SIZE }, (_, i) => i + 1).filter(
      (idx) => idx < propertyImages.length
    );
  }, [propertyImages.length]);

  const firstPageContactSlots = useMemo(() => {
    return Array.from({ length: CONTACT_SHEET_SIZE }, (_, slotIndex) => {
      return firstPageContactIndices[slotIndex] ?? null;
    });
  }, [firstPageContactIndices]);

  const stickyPreviewIndices = useMemo(() => {
    return propertyImages.slice(0, STICKY_PREVIEW_SIZE).map((_, index) => index);
  }, [propertyImages]);

  const handleCloseFullGallery = useCallback(() => {
    setShowFullGallery(false);
    onImageChange(fullGalleryIndex);
  }, [fullGalleryIndex, onImageChange]);

  const lightboxSlides = useMemo(() => {
    return propertyImages.map((src) => ({ src }));
  }, [propertyImages]);

  useEffect(() => {
    if (!showFullGallery) setFullGalleryIndex(currentImageIndex);
  }, [currentImageIndex, showFullGallery]);

  useEffect(() => {
    if (layout !== "modalSidebar") return;
    const target = gridContainerRef.current;
    if (!target) return;
    const win = getWindow();
    if (!win?.IntersectionObserver) return;
    const observer = new win.IntersectionObserver(
      ([entry]) => {
        setIsGridInView(entry.isIntersecting);
      },
      {
        threshold: 0.15,
      }
    );
    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [layout]);

  const totalPages = getTotalPagesCount(propertyImages.length);
  const currentPage = getPageForIndex(currentImageIndex);

  const scrollGalleryToPage = useCallback((page: number, behavior: ScrollBehavior) => {
    const el = galleryScrollRef.current;
    if (!el) return;
    const pageWidth = el.clientWidth;
    el.scrollTo({ left: page * pageWidth, behavior });
  }, []);

  useEffect(() => {
    const page = getPageForIndex(currentImageIndex);
    const behavior: ScrollBehavior = isFirstScrollSyncRef.current ? "auto" : "smooth";
    isFirstScrollSyncRef.current = false;
    scrollGalleryToPage(page, behavior);
  }, [currentImageIndex, scrollGalleryToPage]);

  useEffect(() => {
    const el = galleryScrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      scrollGalleryToPage(getPageForIndex(currentImageIndex), "auto");
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [currentImageIndex, scrollGalleryToPage]);

  const nextImage = useCallback(() => {
    if (totalPages <= 0) return;
    const nextPage = (currentPage + 1) % totalPages;
    onImageChange(getPageStartForPage(nextPage));
  }, [currentPage, onImageChange, totalPages]);

  const prevImage = useCallback(() => {
    if (totalPages <= 0) return;
    const prevPage = (currentPage - 1 + totalPages) % totalPages;
    onImageChange(getPageStartForPage(prevPage));
  }, [currentPage, onImageChange, totalPages]);

  const isModalSidebar = layout === "modalSidebar";

  const lightboxPortalRoot = useMemo(() => getDocument()?.body ?? null, []);

  if (propertyImages.length === 0) {
    if (isLoading) {
      return (
        <Box ref={galleryRootRef} className="relative w-full">
          <Box
            className="bg-background-surface aspect-[4/3] w-full max-w-none animate-pulse rounded-sm"
            aria-hidden
          />
        </Box>
      );
    }
    return null;
  }

  return (
    <Box ref={galleryRootRef} className="relative w-full">
      {isModalSidebar ? (
        <Box
          className={`z-sidebar sticky top-0 transition-all duration-300 ${
            isGridInView ? "h-0 overflow-hidden opacity-0" : "h-auto opacity-100"
          }`}
        >
          <Box
            className={`transition-all duration-300 ${
              isGridInView
                ? "pointer-events-none -translate-y-2 opacity-0"
                : "translate-y-0 opacity-100 shadow-sm"
            } bg-background-base py-1`}
          >
            <Box className="flex items-center gap-0 overflow-hidden">
              <Box className="flex min-w-0 flex-1 gap-0 overflow-x-auto">
                {stickyPreviewIndices.map((imageIndex) => (
                  <Button
                    key={imageIndex}
                    type="button"
                    variant="ghost"
                    onClick={() => openFullGalleryAt(imageIndex)}
                    className="relative aspect-square h-9 w-9 shrink-0 overflow-hidden rounded-sm p-0"
                  >
                    <StyledImage
                      src={propertyImages[imageIndex]}
                      alt={`Thumbnail ${imageIndex + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </Button>
                ))}
              </Box>
              <Button
                type="button"
                variant="ghost"
                onClick={() => openFullGalleryAt(currentImageIndex)}
                className="shrink-0 rounded-full bg-neutral-900 px-2.5 py-0.5 text-xs font-medium text-white hover:bg-neutral-800 [&_svg]:text-white"
              >
                {t("property_details_gallery.see_all_photos", {
                  count: propertyImages.length,
                })}
              </Button>
            </Box>
          </Box>
        </Box>
      ) : null}
      <Box className="relative w-full">
        <Box ref={gridContainerRef} className="w-full overflow-hidden rounded-sm">
          <Box
            ref={galleryScrollRef}
            className="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {Array.from({ length: totalPages }, (_, page) => {
              if (page === 0) {
                const moreAfterFirstPage = Math.max(
                  0,
                  propertyImages.length - FIRST_PAGE_IMAGE_COUNT
                );
                return (
                  <PropertyImageGalleryFirstPage
                    key="gallery-page-0"
                    propertyImages={propertyImages}
                    firstPageContactSlots={firstPageContactSlots}
                    moreAfterFirstPage={moreAfterFirstPage}
                    onOpenGallery={openFullGalleryAt}
                    t={t}
                  />
                );
              }

              const pageStart = getPageStartForPage(page);
              const moreAfterPage = Math.max(
                0,
                propertyImages.length - (pageStart + OTHER_PAGE_IMAGE_COUNT)
              );

              return (
                <PropertyImageGalleryEightGridPage
                  key={`gallery-page-${page}`}
                  page={page}
                  propertyImages={propertyImages}
                  moreAfterPage={moreAfterPage}
                  onOpenGallery={openFullGalleryAt}
                  t={t}
                />
              );
            })}
          </Box>
        </Box>
        {totalPages > 1 && (
          <>
            <Button
              type="button"
              variant="cancel"
              onClick={prevImage}
              className="z-header group absolute left-0 top-1/2 -translate-y-1/2 rounded-full border-0 bg-transparent p-3 text-white shadow-none transition hover:!bg-transparent active:!bg-transparent"
            >
              <Icon name="chevron-left" className="h-10 w-10 stroke-2 text-white" />
            </Button>
            <Button
              type="button"
              variant="cancel"
              onClick={nextImage}
              className="z-header group absolute right-0 top-1/2 -translate-y-1/2 rounded-full border-0 bg-transparent p-3 text-white shadow-none transition hover:!bg-transparent active:!bg-transparent"
            >
              <Icon name="chevron-right" className="h-10 w-10 stroke-2 text-white" />
            </Button>
          </>
        )}
      </Box>
      <Lightbox
        open={showFullGallery}
        close={handleCloseFullGallery}
        index={fullGalleryIndex}
        slides={lightboxSlides}
        plugins={[Zoom, Thumbnails]}
        portal={lightboxPortalRoot ? { root: lightboxPortalRoot } : undefined}
        on={{
          view: ({ index }) => setFullGalleryIndex(index),
        }}
        zoom={{
          maxZoomPixelRatio: 3,
          zoomInMultiplier: 2,
          doubleTapDelay: 300,
          doubleClickDelay: 300,
          doubleClickMaxStops: 2,
          keyboardMoveDistance: 50,
          wheelZoomDistanceFactor: 100,
          pinchZoomDistanceFactor: 100,
          scrollToZoom: true,
        }}
        thumbnails={{
          position: "bottom",
          width: 120,
          height: 80,
          border: 2,
          borderRadius: 4,
          padding: 0,
          gap: 8,
          imageFit: "cover",
          vignette: true,
        }}
        carousel={{
          finite: false,
          preload: 2,
          padding: 0,
          spacing: 0,
          imageFit: "contain",
        }}
        controller={{
          closeOnBackdropClick: true,
          closeOnPullDown: true,
          closeOnPullUp: false,
        }}
      />
    </Box>
  );
};
