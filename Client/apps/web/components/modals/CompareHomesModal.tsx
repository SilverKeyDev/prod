import { X, Download, Share, GitCompare } from "lucide-react";
import React, { useMemo } from "react";

import BaseModal from "./BaseModal";
import Button from "../ui/button/Button";
import IconButton from "../ui/button/IconButton";
import { Title, Subtitle } from "../ui";
import { PropertyCard } from "../cards";
import { CardHeartSave, CardViewDetailsButton } from "../cards/base";
import type { SavedHome } from "../../../../packages/schemas";
import { usePropertyDetails } from "../../../../packages/hooks/data/usePropertyDetails";
import { useUIStore } from "../../../../packages/store";
import { secureClipboardCopy } from "../../../../packages/services/security/clipboardSecurity";

export type CompareHomesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedHomes: SavedHome[];
  onRemove: (homeId: string) => void;
};

const CompareHomesModal: React.FC<CompareHomesModalProps> = ({
  isOpen,
  onClose,
  selectedHomes,
  onRemove,
}) => {
  const { fetchPropertyDetails } = usePropertyDetails();
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  const handleUnlockHome = async (home: SavedHome) => {
    const propertyData = {
      id: home.home_id,
      address: String(home.address || home.description || ""),
      price:
        typeof home.price === "string"
          ? home.price.startsWith("$")
            ? home.price
            : `$${home.price}`
          : typeof home.price === "number"
            ? `$${home.price.toLocaleString()}`
            : "Price not available",
      bedrooms: home.bedrooms ?? 0,
      bathrooms: home.bathrooms ?? 0,
      sqft: home.sqft ?? 0,
      lat: home.lat ?? 0,
      lng: home.lng ?? 0,
      latitude: home.lat ?? 0,
      longitude: home.lng ?? 0,
      images: home.image_url ? [home.image_url] : undefined,
    };

    await fetchPropertyDetails(propertyData);
  };

  // Prepare comparison data for table view
  const comparisonData = useMemo(() => {
    return selectedHomes.map((home) => ({
      id: home.home_id,
      address:
        typeof home.address === "string" || typeof home.address === "number"
          ? home.address.toString()
          : (home.description ?? "Unknown"),
      price:
        typeof home.price === "string"
          ? home.price
          : typeof home.price === "number"
            ? `$${home.price.toLocaleString()}`
            : "N/A",
      bedrooms: home.bedrooms ?? "—",
      bathrooms: home.bathrooms ?? "—",
      sqft: home.sqft && home.sqft > 0 ? home.sqft.toLocaleString() : "—",
      lotSize: typeof home.lot_size === "string" ? home.lot_size : "—",
      imageUrl: home.image_url,
    }));
  }, [selectedHomes]);

  // Export comparison to CSV
  const exportToCSV = () => {
    if (selectedHomes.length === 0) {
      enqueueToast({ type: "error", message: "No homes to export" });
      return;
    }

    const headers = [
      "Property",
      "Address",
      "Price",
      "Bedrooms",
      "Bathrooms",
      "Sqft",
      "Lot Size",
    ];
    const rows = comparisonData.map((home) => [
      home.id,
      home.address,
      home.price,
      String(home.bedrooms),
      String(home.bathrooms),
      home.sqft,
      home.lotSize,
    ]);

    const csvRows = [headers, ...rows].map((r) =>
      r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "homes_comparison.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    enqueueToast({
      type: "success",
      message: "Comparison exported successfully",
    });
  };

  // Share comparison CSV
  const shareCSV = async () => {
    if (selectedHomes.length === 0) {
      enqueueToast({ type: "error", message: "No homes to share" });
      return;
    }

    const headers = [
      "Property",
      "Address",
      "Price",
      "Bedrooms",
      "Bathrooms",
      "Sqft",
      "Lot Size",
    ];
    const rows = comparisonData.map((home) => [
      home.id,
      home.address,
      home.price,
      String(home.bedrooms),
      String(home.bathrooms),
      home.sqft,
      home.lotSize,
    ]);

    const csvRows = [headers, ...rows].map((r) =>
      r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = csvRows.join("\n");

    if (navigator.share) {
      try {
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const file = new File([blob], "homes_comparison.csv", {
          type: "text/csv",
        });
        await navigator.share({
          title: "Homes Comparison",
          text: `Comparison of ${selectedHomes.length} properties`,
          files: [file],
        });
        enqueueToast({ type: "success", message: "CSV shared successfully" });
      } catch (error: unknown) {
        if ((error as Error).name !== "AbortError") {
          const success = await secureClipboardCopy(csvContent);
          if (success) {
            enqueueToast({
              type: "success",
              message: "Comparison data copied to clipboard",
            });
          } else {
            enqueueToast({
              type: "error",
              message: "Unable to share comparison",
            });
          }
        }
      }
    } else {
      const success = await secureClipboardCopy(csvContent);
      if (success) {
        enqueueToast({
          type: "success",
          message: "Comparison data copied to clipboard",
        });
      } else {
        enqueueToast({
          type: "error",
          message: "Unable to share comparison",
        });
      }
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      showCloseButton={false}
      headerContent={
        <div className="flex w-full items-center justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <GitCompare className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
            <span className="truncate text-base font-medium text-gray-900 sm:text-lg">
              Compare Properties
            </span>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
            <IconButton
              onClick={exportToCSV}
              variant="ghost"
              size="sm"
              icon={<Download className="h-4 w-4 sm:h-4 sm:w-4" />}
              disabled={selectedHomes.length === 0}
              className="touch-manipulation text-gray-600 hover:text-gray-900"
              aria-label="Export comparison"
            />
            <IconButton
              onClick={shareCSV}
              variant="ghost"
              size="sm"
              icon={<Share className="h-4 w-4 sm:h-4 sm:w-4" />}
              disabled={selectedHomes.length === 0}
              className="touch-manipulation text-gold hover:text-gold/80"
              aria-label="Share comparison"
            />
            <IconButton
              variant="ghost"
              size="sm"
              icon={<X className="h-4 w-4 sm:h-5 sm:w-5" />}
              onClick={onClose}
              className="flex-shrink-0 touch-manipulation text-gray-400 hover:text-gray-500"
              aria-label="Close modal"
            />
          </div>
        </div>
      }
      className="max-w-7xl"
    >
      <div className="space-y-responsive-md">
        {/* Subtitle */}
        <div>
          <Subtitle size="sm" muted>
            {selectedHomes.length} propert
            {selectedHomes.length === 1 ? "y" : "ies"} selected
          </Subtitle>
        </div>

        {/* Comparison Table - Homes as columns */}
        {selectedHomes.length > 0 && (
          <div className="mb-responsive-md scrollbar-hide overflow-x-auto rounded-lg border">
            <table className="w-full border-collapse text-[10px] sm:text-xs md:text-sm">
              <thead className="bg-beige/30">
                <tr>
                  <th className="sticky left-0 z-10 bg-beige/30 px-1 py-1 text-left font-semibold text-black sm:px-2 sm:py-2 md:px-4 md:py-3">
                    Comparison
                  </th>
                  {comparisonData.map((home, index) => (
                    <th
                      key={home.id}
                      className={`px-1 py-1 text-center font-semibold text-black sm:px-2 sm:py-2 md:px-4 md:py-3 ${
                        selectedHomes.length >= 3
                          ? "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]"
                          : "min-w-[100px] sm:min-w-[120px] md:min-w-[150px]"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {home.imageUrl && (
                          <img
                            src={home.imageUrl}
                            alt={home.address}
                            className="h-8 w-8 rounded object-cover sm:h-10 sm:w-10 md:h-12 md:w-12"
                          />
                        )}
                        <div
                          className="max-w-full truncate text-[9px] sm:text-[10px] md:text-xs"
                          title={home.address}
                        >
                          {home.address}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Price Row */}
                <tr className="border-t border-gray-200 bg-white">
                  <td className="sticky left-0 z-10 bg-white/80 px-1 py-1 font-medium text-black backdrop-blur sm:px-2 sm:py-2 md:px-4 md:py-3">
                    Price
                  </td>
                  {comparisonData.map((home) => (
                    <td
                      key={`price-${home.id}`}
                      className={`px-1 py-1 text-center font-medium text-brown sm:px-2 sm:py-2 md:px-4 md:py-3 ${
                        selectedHomes.length >= 3
                          ? "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]"
                          : "min-w-[100px] sm:min-w-[120px] md:min-w-[150px]"
                      }`}
                    >
                      <span className="text-[9px] sm:text-[10px] md:text-xs">
                        {home.price}
                      </span>
                    </td>
                  ))}
                </tr>
                {/* Bedrooms Row */}
                <tr className="border-t border-gray-200 bg-beige/5">
                  <td className="sticky left-0 z-10 bg-beige/5 px-1 py-1 font-medium text-black backdrop-blur sm:px-2 sm:py-2 md:px-4 md:py-3">
                    Bedrooms
                  </td>
                  {comparisonData.map((home) => (
                    <td
                      key={`bedrooms-${home.id}`}
                      className={`px-1 py-1 text-center text-black/90 sm:px-2 sm:py-2 md:px-4 md:py-3 ${
                        selectedHomes.length >= 3
                          ? "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]"
                          : "min-w-[100px] sm:min-w-[120px] md:min-w-[150px]"
                      }`}
                    >
                      <span className="text-[9px] sm:text-[10px] md:text-xs">
                        {home.bedrooms}
                      </span>
                    </td>
                  ))}
                </tr>
                {/* Bathrooms Row */}
                <tr className="border-t border-gray-200 bg-white">
                  <td className="sticky left-0 z-10 bg-white/80 px-1 py-1 font-medium text-black backdrop-blur sm:px-2 sm:py-2 md:px-4 md:py-3">
                    Bathrooms
                  </td>
                  {comparisonData.map((home) => (
                    <td
                      key={`bathrooms-${home.id}`}
                      className={`px-1 py-1 text-center text-black/90 sm:px-2 sm:py-2 md:px-4 md:py-3 ${
                        selectedHomes.length >= 3
                          ? "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]"
                          : "min-w-[100px] sm:min-w-[120px] md:min-w-[150px]"
                      }`}
                    >
                      <span className="text-[9px] sm:text-[10px] md:text-xs">
                        {home.bathrooms}
                      </span>
                    </td>
                  ))}
                </tr>
                {/* Sqft Row */}
                <tr className="border-t border-gray-200 bg-beige/5">
                  <td className="sticky left-0 z-10 bg-beige/5 px-1 py-1 font-medium text-black backdrop-blur sm:px-2 sm:py-2 md:px-4 md:py-3">
                    Sqft
                  </td>
                  {comparisonData.map((home) => (
                    <td
                      key={`sqft-${home.id}`}
                      className={`px-1 py-1 text-center text-black/90 sm:px-2 sm:py-2 md:px-4 md:py-3 ${
                        selectedHomes.length >= 3
                          ? "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]"
                          : "min-w-[100px] sm:min-w-[120px] md:min-w-[150px]"
                      }`}
                    >
                      <span className="text-[9px] sm:text-[10px] md:text-xs">
                        {home.sqft}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Property Cards Grid View - Scaled down significantly */}
        {selectedHomes.length > 0 && (
          <div>
            <Title size="sm" className="mb-responsive-sm font-medium">
              Property Details
            </Title>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {selectedHomes.map((home: SavedHome) => (
                <div
                  key={home.home_id}
                  className="scale-75 sm:scale-90 md:scale-100"
                >
                  <PropertyCard
                    id={home.home_id}
                    imageUrl={home.image_url}
                    address={
                      typeof home.address === "string" ||
                      typeof home.address === "number"
                        ? home.address.toString()
                        : (home.description ?? "[Invalid address]")
                    }
                    price={
                      typeof home.price === "string" ||
                      typeof home.price === "number"
                        ? home.price.toString()
                        : "[Invalid price]"
                    }
                    bedrooms={home.bedrooms}
                    bathrooms={home.bathrooms}
                    sqft={home.sqft && home.sqft > 0 ? home.sqft : undefined}
                    lotSize={
                      typeof home.lot_size === "string"
                        ? home.lot_size
                        : undefined
                    }
                    pricePosition="below-address"
                    cardType="searchpage"
                    showScore={false}
                    topContent={
                      <div className="flex items-center gap-1">
                        <CardHeartSave
                          property={{
                            id: home.home_id,
                            address: home.address ?? home.description ?? "",
                            price:
                              typeof home.price === "string" ||
                              typeof home.price === "number"
                                ? String(home.price)
                                : "",
                            bedrooms: home.bedrooms ?? 0,
                            bathrooms: home.bathrooms ?? 0,
                            sqft: home.sqft ?? 0,
                            lat: home.lat ?? 0,
                            lng: home.lng ?? 0,
                            images: home.image_url ? [home.image_url] : [],
                          }}
                          size="sm"
                        />
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(home.home_id);
                          }}
                          variant="ghost"
                          size="xs"
                          rounded="full"
                          icon={<X className="h-3 w-3" />}
                          className="bg-white shadow-md ring-1 ring-black/5 hover:scale-105 hover:shadow-lg hover:ring-black/10 active:scale-95 text-gray-400 hover:text-red-500"
                          aria-label="Remove from comparison"
                        />
                      </div>
                    }
                    bottomContent={
                      <CardViewDetailsButton
                        onClick={() => handleUnlockHome(home)}
                        size="xs"
                        variant="primary"
                        fullWidth
                        text="Unlock"
                      />
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedHomes.length === 0 && (
          <div className="py-responsive-lg text-center">
            <p className="text-responsive-sm text-gray-600">
              No homes selected for comparison.
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default CompareHomesModal;
