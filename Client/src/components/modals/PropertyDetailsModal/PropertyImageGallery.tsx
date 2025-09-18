import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

import { StyledImage } from "../../cards/base";

import type { PropertyImageGalleryProps } from "./types";
import { getPropertyImages } from "./utils";

export const PropertyImageGallery: React.FC<PropertyImageGalleryProps> = ({
  property,
  currentImageIndex,
  onImageChange,
}) => {
  const propertyImages = getPropertyImages(property);

  const nextImage = () =>
    onImageChange((currentImageIndex + 1) % propertyImages.length);
  const prevImage = () =>
    onImageChange(
      (currentImageIndex - 1 + propertyImages.length) % propertyImages.length
    );
  const goToImage = (index: number) => onImageChange(index);

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

        {/* Thumbnail Grid - Right 1/3 */}
        {propertyImages.length > 1 && (
          <div className="w-1/3 bg-white p-2">
            <div className="grid h-full grid-cols-2 gap-1">
              {propertyImages.slice(0, 4).map((image, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`relative overflow-hidden rounded border-2 transition-colors ${
                    index === currentImageIndex
                      ? "border-olive"
                      : "border-gray-200 hover:border-olive/50"
                  }`}
                >
                  <StyledImage
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
