import { ChevronLeft, ChevronRight, Grid3X3, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import { StyledImage } from "../../cards/base";

import type { PropertyImageGalleryProps } from "./types";
import { getPropertyImages } from "./utils";

export const PropertyImageGallery: React.FC<PropertyImageGalleryProps> = ({
  property,
  currentImageIndex,
  onImageChange,
}) => {
  const propertyImages = getPropertyImages(property);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [fullGalleryIndex, setFullGalleryIndex] = useState(currentImageIndex);

  const nextFullGalleryImage = useCallback(() => {
    setFullGalleryIndex((prev) => (prev + 1) % propertyImages.length);
  }, [propertyImages.length]);

  const prevFullGalleryImage = useCallback(() => {
    setFullGalleryIndex(
      (prev) => (prev - 1 + propertyImages.length) % propertyImages.length
    );
  }, [propertyImages.length]);

  const handleCloseFullGallery = useCallback(() => {
    setShowFullGallery(false);
    onImageChange(fullGalleryIndex);
  }, [fullGalleryIndex, onImageChange]);

  // Sync fullGalleryIndex with currentImageIndex when gallery is closed
  useEffect(() => {
    if (!showFullGallery) {
      setFullGalleryIndex(currentImageIndex);
    }
  }, [currentImageIndex, showFullGallery]);

  // Keyboard navigation for full gallery
  useEffect(() => {
    if (!showFullGallery) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseFullGallery();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevFullGalleryImage();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextFullGalleryImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showFullGallery,
    handleCloseFullGallery,
    prevFullGalleryImage,
    nextFullGalleryImage,
  ]);

  const nextImage = () =>
    onImageChange((currentImageIndex + 1) % propertyImages.length);
  const prevImage = () =>
    onImageChange(
      (currentImageIndex - 1 + propertyImages.length) % propertyImages.length
    );
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
        {/* Main Image - Left 2/3 */}
        <div className="relative flex-1 overflow-hidden">
          <StyledImage
            src={propertyImages[currentImageIndex]}
            alt={`Property image ${currentImageIndex + 1}`}
            className="h-full w-full object-cover"
          />

          {/* Navigation Arrows */}
          {propertyImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
            {currentImageIndex + 1} / {propertyImages.length}
          </div>
        </div>

        {/* Thumbnail Grid - Right 1/3 - Hidden on mobile */}
        {propertyImages.length > 1 && (
          <div className="hidden md:block w-1/3 bg-white p-2">
            <div className="grid h-full grid-cols-2 gap-1">
              {propertyImages.slice(0, 4).map((image, index) => (
                <button
                  key={index}
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

                  {/* "See all X photos" button overlay on bottom-right thumbnail */}
                  {index === 3 && propertyImages.length > 4 && (
                    <button
                      onClick={handleSeeAllClick}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-medium text-gray-700">
                        <Grid3X3 className="h-3 w-3" />
                        See all {propertyImages.length} photos
                      </div>
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full Gallery Modal */}
      {showFullGallery && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
          onClick={handleCloseFullGallery}
        >
          <div
            className="relative w-full h-full max-w-7xl max-h-[95vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseFullGallery}
              className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Main Image Display */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden">
              <StyledImage
                src={propertyImages[fullGalleryIndex]}
                alt={`Property image ${fullGalleryIndex + 1}`}
                className="max-h-full max-w-full object-contain"
              />

              {/* Navigation Arrows */}
              {propertyImages.length > 1 && (
                <>
                  <button
                    onClick={prevFullGalleryImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>
                  <button
                    onClick={nextFullGalleryImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white">
                {fullGalleryIndex + 1} / {propertyImages.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {propertyImages.length > 1 && (
              <div className="h-32 bg-black/50 p-4 overflow-x-auto">
                <div className="flex gap-2 h-full justify-center">
                  {propertyImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setFullGalleryIndex(index)}
                      className={`relative flex-shrink-0 h-full rounded overflow-hidden border-2 transition-colors ${
                        index === fullGalleryIndex
                          ? "border-white"
                          : "border-transparent hover:border-white/50"
                      }`}
                    >
                      <StyledImage
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="h-full w-auto object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
