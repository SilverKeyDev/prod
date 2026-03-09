import React, { useState } from "react";

import { StyleSheet } from "react-native";

import { PropertyImageGallery } from "packages/features/propertyDetails/components/PropertyDetailsModal/gallery/PropertyImageGallery.native";
import { PropertyHeader } from "packages/features/propertyDetails/components/PropertyDetailsModal/header/PropertyHeader.native";
import type { PropertyDetailsModalProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { BaseModal } from "packages/ui/components/modals";
import { ScrollView } from "packages/ui/components/primitives";

import { useSavedHomesStoreIntegration } from "@/features/search/hooks/store/useSavedHomesStoreIntegration";

import { PropertyDetailsBody } from "./PropertyDetailsBody.native";

export const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
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
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
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

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 500,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});

export default PropertyDetailsModal;
