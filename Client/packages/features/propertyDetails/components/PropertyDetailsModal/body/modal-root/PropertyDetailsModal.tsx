import React, { useEffect, useRef, useState } from "react";

import { PropertyDetailsBody } from "packages/features/propertyDetails/components/PropertyDetailsModal/body/PropertyDetailsBody";
import { PropertyImageGallery } from "packages/features/propertyDetails/components/PropertyDetailsModal/gallery/PropertyImageGallery";
import { PropertyHeader } from "packages/features/propertyDetails/components/PropertyDetailsModal/header/PropertyHeader";
import type { PropertyDetailsModalProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { usePropertyDetailsSectionScroll } from "packages/features/propertyDetails/hooks/usePropertyDetailsSectionScroll.web";
import { useSavedHomesStoreIntegration } from "packages/hooks/store/useSavedHomesStoreIntegration";
import { log, LOG_CATEGORIES } from "packages/logger";
import Cover from "packages/ui/components/modals/cover";
import { Box } from "packages/ui/components/primitives";
import { getWindow } from "packages/utils/platform";

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  onClose,
  onGenerateReport,
  isLoading = false,
  toolbarButtonSize = "medium",
  commuteSearchOverlay = null,
}) => {
  useSavedHomesStoreIntegration();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fullBleedRef = useRef<HTMLDivElement | null>(null);

  const { activeSection, scrollToSection, sectionRefs } = usePropertyDetailsSectionScroll();

  useEffect(() => {
    if (!property || !fullBleedRef.current) return;
    const el = fullBleedRef.current;
    const rect = el.getBoundingClientRect();
    const parent = el.parentElement;
    const parentRect = parent?.getBoundingClientRect();
    const scrollParent = parent?.parentElement;
    const scrollRect = scrollParent?.getBoundingClientRect();
    const vw = getWindow()?.innerWidth ?? 0;
    log.debug(LOG_CATEGORIES.PAGES, "[PropertyDetailsModal] Full-bleed audit", {
      fullBleedWidth: rect.width,
      fullBleedLeft: rect.left,
      fullBleedRight: rect.right,
      parentWidth: parentRect?.width,
      parentLeft: parentRect?.left,
      scrollContainerWidth: scrollRect?.width,
      scrollContainerLeft: scrollRect?.left,
      viewportWidth: vw,
      leftGap: rect.left,
      rightGap: vw - rect.right,
    });
  }, [property]);

  if (!property) return null;

  return (
    <>
      <Cover
        isOpen={true}
        onClose={onClose}
        showCloseButton={false}
        headerContainerClassName="p-0"
        headerContent={
          <PropertyHeader
            property={property}
            onClose={onClose}
            onGenerateReport={onGenerateReport}
            toolbarButtonSize={toolbarButtonSize}
            activeSection={activeSection}
            onScrollToSection={scrollToSection}
          />
        }
        showHeaderBorder={true}
        animation="slideFromRight"
      >
        <Box className="flex flex-col gap-6 pb-6">
          <Box
            ref={fullBleedRef}
            className="-mx-3 -mt-3 box-border w-[calc(100%+1.5rem)] max-w-none shrink-0 sm:-mx-4 sm:-mt-4 sm:w-[calc(100%+2rem)] md:-mx-6 md:-mt-6 md:w-[calc(100%+3rem)]"
          >
            <PropertyImageGallery
              property={property}
              currentImageIndex={currentImageIndex}
              onImageChange={setCurrentImageIndex}
              layout="modalSidebar"
            />
          </Box>
          <Box className="w-full min-w-0 flex-1">
            <PropertyDetailsBody
              property={property}
              isLoading={isLoading}
              sectionRefs={sectionRefs}
              commuteSearchOverlay={commuteSearchOverlay}
            />
          </Box>
        </Box>
      </Cover>
    </>
  );
};

export default PropertyDetailsModal;
