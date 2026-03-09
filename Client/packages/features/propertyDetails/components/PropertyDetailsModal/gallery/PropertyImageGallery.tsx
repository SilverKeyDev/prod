import React, { useCallback, useEffect, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { PropertyImageGalleryProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { getWindow } from "packages/utils/platform";

import { StyledImage } from "@/components/cards/base/image";
import { Button } from "@/components/ui";
import { getPropertyImages } from "@/features/search/types/search/propertyDetailsFormatters";

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
    <div className="relative bg-gray-100">
      <div className="flex h-96">
        <div className="relative flex-1 overflow-hidden">
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
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
              >
                <Icon name="chevron-left" className="h-6 w-6" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
              >
                <Icon name="chevron-right" className="h-6 w-6" />
              </Button>
            </>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
            {currentImageIndex + 1}
            {t("property_details_gallery.counter_sep")}
            {propertyImages.length}
          </div>
        </div>
        {propertyImages.length > 1 && (
          <div className="hidden w-1/3 bg-white p-2 md:block">
            <div className="grid h-full grid-cols-2 gap-1">
              {propertyImages.slice(0, 4).map((image, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="ghost"
                  onClick={() => goToImage(index)}
                  className={`relative overflow-hidden rounded border-2 transition-colors ${
                    index === currentImageIndex
                      ? "border-stone-300"
                      : "border-stone-100 hover:border-stone-200"
                  }`}
                >
                  <StyledImage
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {index === 3 && propertyImages.length > 4 && (
                    <div
                      onClick={handleSeeAllClick}
                      className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 transition-colors hover:bg-black/60"
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
                      <div className="flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-medium text-gray-700">
                        <Icon name="grid-3x3" className="h-3 w-3" />
                        {t("property_details_gallery.see_all_photos", {
                          count: propertyImages.length,
                        })}
                      </div>
                    </div>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
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
    </div>
  );
};
