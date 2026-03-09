import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";

import { StyledImage } from "@/components/cards/base/image";
import { Button } from "@/components/ui";
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
        className="relative flex h-full max-h-screen w-full max-w-7xl flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") e.preventDefault();
        }}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
        >
          <Icon name="x" className="h-6 w-6" />
        </Button>
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
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
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
              >
                <Icon name="chevron-left" className="h-8 w-8" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
              >
                <Icon name="chevron-right" className="h-8 w-8" />
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
          <div className="h-32 overflow-x-auto bg-black/50 p-4">
            <div className="flex h-full justify-center gap-2">
              {images.map((image, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="ghost"
                  onClick={() => onIndexChange(index)}
                  className={`relative h-full flex-shrink-0 overflow-hidden rounded border-2 transition-colors ${
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
