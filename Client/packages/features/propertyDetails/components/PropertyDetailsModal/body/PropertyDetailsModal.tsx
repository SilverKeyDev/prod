import React, { useState } from "react";

import { PropertyImageGallery } from "packages/features/propertyDetails/components/PropertyDetailsModal/gallery/PropertyImageGallery";
import { PropertyHeader } from "packages/features/propertyDetails/components/PropertyDetailsModal/header/PropertyHeader";
import type { PropertyDetailsModalProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { BaseModal } from "packages/ui/components/modals";
import { ScrollView } from "packages/ui/components/primitives";

import { useSavedHomesStoreIntegration } from "@/features/search/hooks/store/useSavedHomesStoreIntegration";

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
    <BaseModal
      isOpen={true}
      onClose={onClose}
      showCloseButton={false}
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
      <ScrollView
        className="max-h-96"
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
      >
        <PropertyImageGallery
          property={property}
          currentImageIndex={currentImageIndex}
          onImageChange={setCurrentImageIndex}
        />
        <PropertyDetailsBody property={property} isLoading={isLoading} />
      </ScrollView>
    </BaseModal>
  );
};

export default PropertyDetailsModal;
