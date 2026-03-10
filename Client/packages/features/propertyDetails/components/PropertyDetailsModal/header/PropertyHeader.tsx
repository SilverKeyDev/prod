import React, { useCallback, useState } from "react";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import type { PropertyHeaderProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { useNavigation } from "packages/navigation";
import { ConnectedCardHeartSave } from "packages/ui/components/button/ConnectedCardHeartSave";
import { Icon } from "packages/ui/components/primitives";
import { Box, Pressable, Text } from "packages/ui/components/primitives";
import { setToStorage } from "packages/utils/storage";

import ShareHomeModal from "@/components/modals/ShareHomeModal";

function getDisplayAddress(address: unknown): string | null {
  if (typeof address === "string" && address.trim().length > 0) return address;
  if (typeof address === "object" && address !== null) {
    const o = address as {
      streetAddress?: string;
      city?: string;
      state?: string;
      zipcode?: string;
    };
    const parts: string[] = [];
    if (o.streetAddress) parts.push(o.streetAddress);
    if (o.city) parts.push(o.city);
    if (o.state) parts.push(o.state);
    if (o.zipcode) parts.push(o.zipcode);
    if (parts.length > 0) return parts.join(", ");
  }
  return null;
}

function normalizePropertyForFavorites(property: PropertyHeaderProps["property"]): {
  id: string;
  address: string;
  [key: string]: unknown;
} {
  const p = property as {
    id?: string;
    home_id?: string;
    address?: unknown;
    streetAddress?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  };
  const addressStr =
    getDisplayAddress(p.address) ??
    (p.streetAddress
      ? [p.streetAddress, p.city, p.state, p.zipcode].filter(Boolean).join(", ")
      : "");
  const id = typeof p.id === "string" ? p.id : typeof p.home_id === "string" ? p.home_id : "";
  return {
    ...(property as Record<string, unknown>),
    id,
    address: addressStr || "",
  };
}

export const PropertyHeader: React.FC<PropertyHeaderProps> = ({
  property,
  onClose,
  onBack,
  onGenerateReport,
  toolbarButtonSize = "medium",
}) => {
  const { t } = useLocalization();
  const { navigate } = useNavigation();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const propertyAddress = (property as { address?: unknown }).address;
  const displayAddress = getDisplayAddress(propertyAddress);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      onClose();
    }
  }, [onBack, onClose]);

  const handleGenerateFullReport = useCallback(() => {
    const address = getDisplayAddress(propertyAddress) ?? "";
    const generateReportState = {
      address,
      reportType: "detailed",
      selectedClientId: "",
    };
    setToStorage("generateReportState", generateReportState);
    if (onGenerateReport) {
      onGenerateReport(address);
    }
    navigate("SAVED");
  }, [navigate, onGenerateReport, propertyAddress]);

  const handleShare = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);

  const iconSize = toolbarButtonSize === "large" ? 22 : toolbarButtonSize === "small" ? 18 : 20;

  return (
    <Box className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      {/* Left: Back + Title */}
      <Box className="min-w-0 flex-1 flex-row items-center gap-2">
        <Pressable
          onPress={handleBack}
          className="rounded-lg p-2"
          label={t("common.back", { defaultValue: "Back" })}
        >
          <Icon name="chevron-left" size={iconSize} color={color("neutral.700")} />
        </Pressable>
        {displayAddress ? (
          <Text className="flex-1 text-base font-semibold text-gray-900" numberOfLines={1}>
            {displayAddress}
          </Text>
        ) : null}
      </Box>

      {/* Right: Generate report, Share, Heart */}
      <Box className="flex-row items-center gap-1">
        {onGenerateReport ? (
          <Pressable
            onPress={handleGenerateFullReport}
            className="rounded-lg p-2"
            label={t("property_details.generate_report", {
              defaultValue: "Generate report",
            })}
          >
            <Icon name="file-text" size={iconSize} color={color("neutral.600")} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={handleShare}
          className="rounded-lg p-2"
          label={t("common.share_aria", { defaultValue: "Share" })}
        >
          <Icon name="share" size={iconSize} color={color("neutral.600")} />
        </Pressable>
        <ConnectedCardHeartSave
          property={normalizePropertyForFavorites(property)}
          size={toolbarButtonSize === "large" ? "lg" : toolbarButtonSize === "small" ? "sm" : "md"}
        />
      </Box>

      {/* Share Home Modal */}
      <ShareHomeModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        property={property}
        onShareSuccess={() => {
          // Optionally show a success message or refresh data
        }}
      />
    </Box>
  );
};
