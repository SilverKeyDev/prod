import React, { useState } from "react";

import { PropertyAgent } from "./PropertyAgent";
import { PropertyAnalysis } from "./PropertyAnalysis";
import { PropertyBasicInfo } from "./PropertyBasicInfo";
import { PropertyCommute } from "./PropertyCommute";
import { PropertyFeatures } from "./PropertyFeatures";
import { PropertyHeader } from "./PropertyHeader";
import { PropertyImageGallery } from "./PropertyImageGallery";
import { PropertySchools } from "./PropertySchools";
import type { PropertyDetailsModalProps } from "./types";

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  onClose,
  onGenerateReport,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!property) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div className="fixed inset-0 bg-gray-200/40 backdrop-blur-sm" />

      {/* Modal content */}
      <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <PropertyHeader
          property={property}
          onClose={onClose}
          onGenerateReport={onGenerateReport}
        />

        {/* Image Gallery */}
        <PropertyImageGallery
          property={property}
          currentImageIndex={currentImageIndex}
          onImageChange={setCurrentImageIndex}
        />

        {/* Basic Information */}
        <PropertyBasicInfo property={property} />

        {/* Property Analysis */}
        <PropertyAnalysis property={property} />

        {/* Property Features */}
        <PropertyFeatures property={property} />

        {/* Commute Information */}
        <PropertyCommute property={property} />

        {/* Agent & Schools */}
        <div className="mb-6 mx-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <PropertyAgent property={property} />
          <PropertySchools property={property} />
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsModal;
