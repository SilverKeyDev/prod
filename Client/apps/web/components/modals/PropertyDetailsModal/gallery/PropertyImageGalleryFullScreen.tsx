import React from "react";

import { Button } from "@ui/index.web";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { useLocalization } from "packages/contexts";

import { StyledImage } from "@/components/cards/base/image";

type PropertyImageGalleryFullScreenProps = {
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function PropertyImageGalleryFullScreen({
  images,
  currentIndex,
  onIndexChange,
  onClose,
  onPrev,
  onNext,
}: PropertyImageGalleryFullScreenProps) {
  const { t } = useLocalization();

  return (
    <div
      role="button"
      tabIndex={0}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div
        role="button"
        tabIndex={0}
        className="relative w-full h-full max-w-7xl max-h-screen flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") e.preventDefault();
        }}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
        >
          <X className="h-6 w-6" />
        </Button>
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          <StyledImage
            src={images[currentIndex]}
            alt={`Property image ${currentIndex + 1}`}
            className="max-h-full max-w-full object-contain"
          />
          {images.length > 1 && (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={onPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white">
                {currentIndex + 1}
                {t("property_details_gallery.counter_sep")}
                {images.length}
              </div>
            </>
          )}
        </div>
        {images.length > 1 && (
          <div className="h-32 bg-black/50 p-4 overflow-x-auto">
            <div className="flex gap-2 h-full justify-center">
              {images.map((image, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="ghost"
                  onClick={() => onIndexChange(index)}
                  className={`relative flex-shrink-0 h-full rounded overflow-hidden border-2 transition-colors ${
                    index === currentIndex
                      ? "border-white"
                      : "border-transparent hover:border-white/50"
                  }`}
                >
                  <StyledImage
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="h-full w-auto object-cover"
                  />
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
