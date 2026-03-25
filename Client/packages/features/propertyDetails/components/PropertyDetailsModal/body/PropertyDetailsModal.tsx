import React, { useState } from "react";

import { PropertyImageGallery } from "packages/features/propertyDetails/components/PropertyDetailsModal/gallery/PropertyImageGallery";
import { PropertyHeader } from "packages/features/propertyDetails/components/PropertyDetailsModal/header/PropertyHeader";
import type { PropertyDetailsModalProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { useSavedHomesStoreIntegration } from "packages/hooks/store/useSavedHomesStoreIntegration";
import Cover from "packages/ui/components/modals/cover";
import { Box } from "packages/ui/components/primitives";

import { PropertyDetailsBody } from "./PropertyDetailsBody";

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  onClose,
  onGenerateReport,
  isLoading = false,
  toolbarButtonSize = "medium",
}) => {
  useSavedHomesStoreIntegration();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!property) return null;

  return (
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
        />
      }
      showHeaderBorder={true}
      animation="slideFromRight"
    >
      <Box className="pb-6">
        <PropertyImageGallery
          property={property}
          currentImageIndex={currentImageIndex}
          onImageChange={setCurrentImageIndex}
        />
        <PropertyDetailsBody property={property} isLoading={isLoading} />
      </Box>
    </Cover>
  );
};

export default PropertyDetailsModal;
