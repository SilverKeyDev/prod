import React, { useCallback, useEffect, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { PropertyImageGalleryProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import Button from "packages/ui/components/button/Button";
import { StyledImage } from "packages/ui/components/cards/base";
import { Box } from "packages/ui/components/primitives";
import { getWindow } from "packages/utils/platform";
import { getPropertyImages } from "packages/utils/propertyDetails";

import { PropertyImageGalleryFullScreen } from "./PropertyImageGalleryFullScreen";
export const PropertyImageGallery: React.FC<PropertyImageGalleryProps> = ({
  property,
  currentImageIndex,
  onImageChange,
}) => {
  const { t } = useLocalization();
  const propertyImages = getPropertyImages(property);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [fullGalleryIndex, setFullGalleryIndex] = useState(currentImageIndex);
  const nextFullGalleryImage = useCallback(() => {
    setFullGalleryIndex((prev) => (prev + 1) % propertyImages.length);
  }, [propertyImages.length]);
  const prevFullGalleryImage = useCallback(() => {
    setFullGalleryIndex((prev) => (prev - 1 + propertyImages.length) % propertyImages.length);
  }, [propertyImages.length]);
  const handleCloseFullGallery = useCallback(() => {
    setShowFullGallery(false);
    onImageChange(fullGalleryIndex);
  }, [fullGalleryIndex, onImageChange]);
  useEffect(() => {
    if (!showFullGallery) setFullGalleryIndex(currentImageIndex);
  }, [currentImageIndex, showFullGallery]);
  useEffect(() => {
    if (!showFullGallery) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseFullGallery();
      else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevFullGalleryImage();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextFullGalleryImage();
      }
    };
    const win = getWindow();
    if (win) win.addEventListener("keydown", handleKeyDown);
    return () => {
      if (win) win.removeEventListener("keydown", handleKeyDown);
    };
  }, [showFullGallery, handleCloseFullGallery, prevFullGalleryImage, nextFullGalleryImage]);
  const nextImage = () => onImageChange((currentImageIndex + 1) % propertyImages.length);
  const prevImage = () =>
    onImageChange((currentImageIndex - 1 + propertyImages.length) % propertyImages.length);
  const goToImage = (index: number) => onImageChange(index);
  const handleSeeAllClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFullGalleryIndex(currentImageIndex);
    setShowFullGallery(true);
  };
  if (propertyImages.length === 0) return null;
  return (
    <Box className="bg-primary-muted relative">
      <Box className="flex h-96 flex-row">
        <Box className="relative flex-1 overflow-hidden">
          <StyledImage
            src={propertyImages[currentImageIndex]}
            alt={`Property image ${currentImageIndex + 1}`}
            className="h-full w-full object-cover"
          />
          {propertyImages.length > 1 && (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={prevImage}
                className="bg-text-primary hover:bg-primary-hover active:bg-primary-hover absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-white"
              >
                <Icon name="chevron-left" className="h-6 w-6" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={nextImage}
                className="bg-text-primary hover:bg-primary-hover active:bg-primary-hover absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-white"
              >
                <Icon name="chevron-right" className="h-6 w-6" />
              </Button>
            </>
          )}
          <Box className="bg-text-primary absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-sm text-white">
            {currentImageIndex + 1}
            {t("property_details_gallery.counter_sep")}
            {propertyImages.length}
          </Box>
        </Box>
        {propertyImages.length > 1 && (
          <Box className="bg-background-surface hidden w-1/3 p-2 md:flex md:flex-col">
            <Box className="flex-two-cols-gap-1">
              {propertyImages.slice(0, 4).map((image, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="ghost"
                  onClick={() => goToImage(index)}
                  // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
                  className={`relative overflow-hidden rounded border-2 ${index === currentImageIndex ? "border-stone-300" : "border-stone-100 hover:border-stone-200 active:border-stone-300 active:opacity-90"} active:border-stone-200`}
                >
                  <StyledImage
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {index === 3 && propertyImages.length > 4 && (
                    <Box
                      onClick={handleSeeAllClick}
                      className="bg-text-primary hover:bg-primary-hover active:bg-primary-hover absolute inset-0 flex cursor-pointer flex-row items-center justify-center"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          setFullGalleryIndex(currentImageIndex);
                          setShowFullGallery(true);
                        }
                      }}
                    >
                      <Box className="bg-background-surface text-text-secondary flex flex-row items-center gap-1 rounded px-2 py-1 text-xs font-medium">
                        <Icon name="grid-3x3" className="h-3 w-3" />
                        {t("property_details_gallery.see_all_photos", {
                          count: propertyImages.length,
                        })}
                      </Box>
                    </Box>
                  )}
                </Button>
              ))}
            </Box>
          </Box>
        )}
      </Box>
      {showFullGallery && (
        <PropertyImageGalleryFullScreen
          images={propertyImages}
          currentIndex={fullGalleryIndex}
          onIndexChange={setFullGalleryIndex}
          onClose={handleCloseFullGallery}
          onPrev={prevFullGalleryImage}
          onNext={nextFullGalleryImage}
        />
      )}
    </Box>
  );
};
