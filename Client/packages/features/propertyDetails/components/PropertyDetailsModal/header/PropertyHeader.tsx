import React, { useCallback, useState } from "react";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import type { PropertyHeaderProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import type { PropertyDetailsSectionId } from "packages/features/propertyDetails/types/sectionOrder";
import { PROPERTY_DETAILS_SECTION_ORDER } from "packages/features/propertyDetails/types/sectionOrder";
import { useNavigation } from "packages/navigation";
import { ConnectedCardHeartSave } from "packages/ui/components/button/ConnectedCardHeartSave";
import ShareHomeModal from "packages/ui/components/modals/ShareHomeModal";
import { Icon } from "packages/ui/components/primitives";
import { Box, Pressable, Text } from "packages/ui/components/primitives";
import type { UnderlineTabItem } from "packages/ui/components/tabs/UnderlineTabs";
import { UnderlineTabs } from "packages/ui/components/tabs/UnderlineTabs";
import { setToStorage } from "packages/utils/storage";

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

function normalizePropertyForFavorites(
  property: PropertyHeaderProps["property"],
): {
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
  const id =
    typeof p.id === "string"
      ? p.id
      : typeof p.home_id === "string"
        ? p.home_id
        : "";
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
  activeSection = "overview",
  onScrollToSection,
}) => {
  const { t } = useLocalization();
  const { navigate } = useNavigation();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const tabItems: UnderlineTabItem[] = PROPERTY_DETAILS_SECTION_ORDER.map(
    (id) => ({
      id,
      label: t(`property_details.tab_${id}`, {
        defaultValue: id.charAt(0).toUpperCase() + id.slice(1),
      }),
    }),
  );

  const handleTabChange = useCallback(
    (tabId: string) => {
      if (onScrollToSection) {
        // Safe cast: tabs are generated from PROPERTY_DETAILS_SECTION_ORDER
        onScrollToSection(tabId as PropertyDetailsSectionId);
      }
    },
    [onScrollToSection],
  );

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

  const iconSize =
    toolbarButtonSize === "large"
      ? 22
      : toolbarButtonSize === "small"
        ? 18
        : 20;

  return (
    <>
      <Box
        className="border-border bg-background-surface flex w-full flex-col border-b"
        data-property-header
      >
        {/* Single row: Back button, address, tabs (centered), and action buttons */}
        <Box className="flex w-full flex-row flex-nowrap items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
          {/* Left section: Back button and address */}
          <Box className="flex min-w-0 flex-1 flex-row flex-nowrap items-center gap-2">
            <Pressable
              onPress={handleBack}
              className="shrink-0 rounded-lg p-2"
              label={t("common.back", { defaultValue: "Back" })}
            >
              <Icon
                name="chevron-left"
                size={iconSize}
                color={color("neutral.700")}
              />
            </Pressable>
            {displayAddress ? (
              <Text
                className="text-text-primary m-0 min-w-0 flex-1 truncate text-base font-semibold"
                numberOfLines={1}
              >
                {displayAddress}
              </Text>
            ) : null}
          </Box>

          {/* Center section: Navigation tabs */}
          <Box className="flex shrink-0 justify-center">
            <UnderlineTabs
              items={tabItems}
              activeId={activeSection}
              onChange={handleTabChange}
              size="sm"
              compact={true}
            />
          </Box>

          {/* Right section: Action buttons */}
          <Box className="flex min-w-0 flex-1 flex-row flex-nowrap items-center justify-end gap-1">
            {onGenerateReport ? (
              <Pressable
                onPress={handleGenerateFullReport}
                className="shrink-0 rounded-lg p-2"
                label={t("property_details.generate_report", {
                  defaultValue: "Generate report",
                })}
              >
                <Icon
                  name="file-text"
                  size={iconSize}
                  color={color("neutral.600")}
                />
              </Pressable>
            ) : null}
            <Pressable
              onPress={handleShare}
              className="shrink-0 rounded-lg p-2"
              label={t("common.share_aria", { defaultValue: "Share" })}
            >
              <Icon name="share" size={iconSize} color={color("neutral.600")} />
            </Pressable>
            <ConnectedCardHeartSave
              property={normalizePropertyForFavorites(property)}
              inline
              size={
                toolbarButtonSize === "large"
                  ? "lg"
                  : toolbarButtonSize === "small"
                    ? "sm"
                    : "md"
              }
            />
          </Box>
        </Box>
      </Box>

      <ShareHomeModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        property={property}
        onShareSuccess={() => {
          // Optionally show a success message or refresh data
        }}
      />
    </>
  );
};
