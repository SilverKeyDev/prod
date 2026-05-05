import React, { useState } from "react";

import { PropertyDetailsBody } from "packages/features/propertyDetails/components/PropertyDetailsModal/body/PropertyDetailsBody";
import { PropertyImageGallery } from "packages/features/propertyDetails/components/PropertyDetailsModal/gallery/PropertyImageGallery.native";
import { PropertyHeader } from "packages/features/propertyDetails/components/PropertyDetailsModal/header/PropertyHeader";
import type { PropertyDetailsModalProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { useSavedHomesStoreIntegration } from "packages/hooks/store/useSavedHomesStoreIntegration";
import Cover from "packages/ui/components/modals/cover";

export const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  onClose,
  onGenerateReport,
  isLoading = false,
  toolbarButtonSize = "medium",
  commuteSearchOverlay = null,
}) => {
  useSavedHomesStoreIntegration();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!property) return null;

  return (
    <>
      <Cover
        isOpen={true}
        onClose={onClose}
        showCloseButton={false}
        headerContainerStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
        headerContent={
          <PropertyHeader
            property={property}
            onClose={onClose}
            onGenerateReport={onGenerateReport}
            toolbarButtonSize={toolbarButtonSize}
          />
        }
        showHeaderBorder={true}
      >
        <PropertyImageGallery
          property={property}
          currentImageIndex={currentImageIndex}
          onImageChange={setCurrentImageIndex}
          isLoading={isLoading}
        />
        <PropertyDetailsBody
          property={property}
          isLoading={isLoading}
          commuteSearchOverlay={commuteSearchOverlay}
        />
      </Cover>
    </>
  );
};

export default PropertyDetailsModal;
