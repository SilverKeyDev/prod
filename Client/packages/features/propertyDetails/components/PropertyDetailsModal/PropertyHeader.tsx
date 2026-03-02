import React, { useState } from "react";

import KeyLogo from "@ui/asset/KeyLogo";
import Button from "@ui/button/Button";
import { FileText, Share } from "lucide-react";

import { useLocalization } from "packages/contexts";
import { useNavigation } from "packages/navigation";
import { MiniLogo } from "packages/ui/components";
import { CloseButton, IconButton, Title } from "packages/ui/components/index.web";
import { setToStorage } from "packages/utils/storage";

import ShareHomeModal from "@/components/modals/ShareHomeModal";
import { ConnectedCardHeartSave } from "@/features/search/components/ConnectedCardHeartSave";
import type { AddressObject } from "@/features/search/types/search/propertyDetailsFormatters";
import { formatAddress } from "@/features/search/types/search/propertyDetailsFormatters";

import type { PropertyHeaderProps } from "./types";

/** Normalize property for favorites API - address must be a string (API rejects object addresses) */
function normalizePropertyForFavorites(property: PropertyHeaderProps["property"]): {
  id: string;
  address: string;
  [key: string]: unknown;
} {
  const p = property as {
    id: string;
    address?: unknown;
    streetAddress?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  };
  const addr = p.address;
  let addressStr = typeof addr === "string" ? addr : formatAddress(addr as AddressObject);
  if (!addressStr && (p.streetAddress || p.city || p.state)) {
    addressStr = formatAddress({
      streetAddress: p.streetAddress,
      city: p.city,
      state: p.state,
      zipcode: p.zipcode,
    });
  }
  return {
    ...(property as Record<string, unknown>),
    id: p.id,
    address: addressStr || p.streetAddress || "",
  };
}

function getDisplayAddress(address: unknown): string | null {
  if (typeof address === "string") return address;
  if (typeof address === "object" && address !== null && "streetAddress" in address) {
    return formatAddress(address as string | AddressObject | null | undefined);
  }
  return null;
}

export const PropertyHeader: React.FC<PropertyHeaderProps> = ({
  property,
  onClose,
  onGenerateReport,
  toolbarButtonSize = "medium",
}) => {
  const { t } = useLocalization();
  const { navigate } = useNavigation();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const propertyAddress = (property as unknown as { address: unknown }).address;
  const displayAddress = getDisplayAddress(propertyAddress);

  const handleGenerateFullReport = () => {
    const address = formatAddress(propertyAddress as string | AddressObject | null | undefined);

    // Save the address to platform storage for the GenerateReportPage (RN-safe)
    const generateReportState = {
      address,
      reportType: "detailed",
      selectedClientId: "",
    };

    setToStorage("generateReportState", generateReportState);

    // Call the optional callback if provided
    if (onGenerateReport) {
      onGenerateReport(address);
    }

    // Navigate to the saved page
    navigate("SAVED");
  };

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-4">
      {/* Left side - Logo and Title */}
      <div className="flex items-center">
        <MiniLogo size="sm" className="md:hidden" />
        <KeyLogo size="sm" className="hidden md:block" />
        {displayAddress && (
          <Title as="h1" size="sm" className="ml-3 truncate font-semibold text-gray-900 sm:text-lg">
            {displayAddress}
          </Title>
        )}
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-0.5 md:gap-3">
        {/* <Button
          variant="outline"
          size="md"
          onClick={() => handleZillowOpen(property)}
          icon={<ExternalLink className="h-5 w-5 text-blue-600" />}
          className="group border-blue-600 !text-blue-600 hover:!bg-transparent hover:!text-blue-600 transition-all duration-200"
        >
          Zillow
        </Button> */}
        {onGenerateReport && (
          <Button
            variant="outline"
            size="md"
            onClick={handleGenerateFullReport}
            icon={<FileText className="h-5 w-5 text-gray-600" />}
            className="border-gray-600 text-gray-600 hover:bg-gray-50"
          >
            {t("property_details.generate_report")}
          </Button>
        )}
        <IconButton
          variant="toolbar"
          size={toolbarButtonSize}
          rounded="md"
          icon={<Share className="h-full w-full" />}
          onClick={() => setIsShareModalOpen(true)}
          label={t("common.share_aria")}
        />

        <ConnectedCardHeartSave
          property={normalizePropertyForFavorites(property)}
          size={toolbarButtonSize}
          className="rounded-md text-gray-600 transition-colors hover:bg-gray-50"
        />

        <CloseButton
          variant="toolbar"
          size={toolbarButtonSize}
          rounded="md"
          onClick={onClose}
          label="Close modal"
        />
      </div>

      {/* Share Home Modal */}
      <ShareHomeModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        property={property}
        onShareSuccess={() => {
          // Optionally show a success message or refresh data
        }}
      />
    </div>
  );
};
