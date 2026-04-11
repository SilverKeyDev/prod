import React from "react";

import { Icon } from "@ui/icons";

import type { LocalizationContextType } from "packages/contexts/LocalizationContext";
import { StyledImage } from "packages/ui/components/cards/base";
import { Box } from "packages/ui/components/primitives";

import {
  FIRST_PAGE_IMAGE_COUNT,
  getPageStartForPage,
  GRID_GAP_CLASS,
  OTHER_PAGE_IMAGE_COUNT,
} from "./propertyImageGalleryPagination";

type OpenGallery = (index: number) => void;

type FirstPageProps = {
  propertyImages: string[];
  firstPageContactSlots: (number | null)[];
  moreAfterFirstPage: number;
  onOpenGallery: OpenGallery;
  t: LocalizationContextType["t"];
};

export function PropertyImageGalleryFirstPage({
  propertyImages,
  firstPageContactSlots,
  moreAfterFirstPage,
  onOpenGallery,
  t,
}: FirstPageProps) {
  return (
    <Box
      className={`grid aspect-[16/7] max-h-[65vh] w-full min-w-full shrink-0 snap-start grid-cols-2 ${GRID_GAP_CLASS}`}
    >
      <Box
        className="group relative min-h-0 cursor-pointer overflow-hidden"
        onClick={() => onOpenGallery(0)}
      >
        <StyledImage
          src={propertyImages[0]}
          alt="Property image 1"
          className="h-full w-full cursor-pointer object-cover"
        />
        <Box className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
        <Box className="absolute bottom-2 right-2 rounded-full bg-neutral-900/70 px-2 py-0.5 text-xs text-white">
          {1}–{Math.min(FIRST_PAGE_IMAGE_COUNT, propertyImages.length)}
          {t("property_details_gallery.counter_sep")}
          {propertyImages.length}
        </Box>
      </Box>
      <Box className={`grid min-h-0 grid-cols-2 grid-rows-2 ${GRID_GAP_CLASS}`}>
        {firstPageContactSlots.map((imageIndex, slotIndex) => {
          const isBottomRightSlot =
            slotIndex === firstPageContactSlots.length - 1;
          const hasImage = imageIndex !== null;
          return (
            <Box
              key={`slot-${slotIndex}`}
              className="relative min-h-0 overflow-hidden bg-neutral-200"
            >
              {hasImage ? (
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenGallery(imageIndex)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpenGallery(imageIndex);
                    }
                  }}
                  className="h-full w-full cursor-pointer"
                >
                  <StyledImage
                    src={propertyImages[imageIndex]}
                    alt={`Thumbnail ${imageIndex + 1}`}
                    className="h-full w-full object-cover"
                  />
                </Box>
              ) : null}
              {isBottomRightSlot && moreAfterFirstPage > 0 ? (
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenGallery(FIRST_PAGE_IMAGE_COUNT)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpenGallery(FIRST_PAGE_IMAGE_COUNT);
                    }
                  }}
                  className="absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center bg-black/60 text-white transition hover:bg-black/70"
                >
                  <Box className="flex flex-col items-center gap-1">
                    <Icon name="grid-3x3" className="h-8 w-8" />
                    <Box className="text-sm font-medium">
                      +{moreAfterFirstPage} more
                    </Box>
                  </Box>
                </Box>
              ) : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

type EightGridPageProps = {
  page: number;
  propertyImages: string[];
  moreAfterPage: number;
  onOpenGallery: OpenGallery;
  t: LocalizationContextType["t"];
};

export function PropertyImageGalleryEightGridPage({
  page,
  propertyImages,
  moreAfterPage,
  onOpenGallery,
  t,
}: EightGridPageProps) {
  const pageStart = getPageStartForPage(page);
  const rangeEnd = Math.min(
    pageStart + OTHER_PAGE_IMAGE_COUNT,
    propertyImages.length,
  );

  return (
    <Box className="relative w-full min-w-full shrink-0 snap-start">
      <Box
        className={`grid aspect-[16/7] max-h-[65vh] w-full grid-cols-2 ${GRID_GAP_CLASS}`}
      >
        <Box
          className={`grid min-h-0 grid-cols-2 grid-rows-2 ${GRID_GAP_CLASS}`}
        >
          {Array.from({ length: 4 }, (_, i) => {
            const imageIndex = pageStart + i;
            const hasImage = imageIndex < propertyImages.length;
            return (
              <Box
                key={`p${page}-l-${i}`}
                className="relative min-h-0 overflow-hidden bg-neutral-200"
              >
                {hasImage ? (
                  <Box
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenGallery(imageIndex)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onOpenGallery(imageIndex);
                      }
                    }}
                    className="h-full w-full cursor-pointer"
                  >
                    <StyledImage
                      src={propertyImages[imageIndex]}
                      alt={`Thumbnail ${imageIndex + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </Box>
        <Box
          className={`grid min-h-0 grid-cols-2 grid-rows-2 ${GRID_GAP_CLASS}`}
        >
          {Array.from({ length: 4 }, (_, i) => {
            const imageIndex = pageStart + 4 + i;
            const hasImage = imageIndex < propertyImages.length;
            const isMoreTile = i === 3 && moreAfterPage > 0;
            return (
              <Box
                key={`p${page}-r-${i}`}
                className="relative min-h-0 overflow-hidden bg-neutral-200"
              >
                {hasImage ? (
                  <Box
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenGallery(imageIndex)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onOpenGallery(imageIndex);
                      }
                    }}
                    className="h-full w-full cursor-pointer"
                  >
                    <StyledImage
                      src={propertyImages[imageIndex]}
                      alt={`Thumbnail ${imageIndex + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </Box>
                ) : null}
                {isMoreTile ? (
                  <Box
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      onOpenGallery(pageStart + OTHER_PAGE_IMAGE_COUNT)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onOpenGallery(pageStart + OTHER_PAGE_IMAGE_COUNT);
                      }
                    }}
                    className="absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center bg-black/60 text-white transition hover:bg-black/70"
                  >
                    <Box className="flex flex-col items-center gap-1">
                      <Icon name="grid-3x3" className="h-8 w-8" />
                      <Box className="text-sm font-medium">
                        +{moreAfterPage} more
                      </Box>
                    </Box>
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </Box>
      </Box>
      <Box className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-neutral-900/70 px-2 py-0.5 text-xs text-white">
        {pageStart + 1}–{rangeEnd}
        {t("property_details_gallery.counter_sep")}
        {propertyImages.length}
      </Box>
    </Box>
  );
}
