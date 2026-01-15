import { useState, useEffect, useCallback } from "react";
import { PropertyCard } from "../../../components/cards";
import {
  CardHeartSave,
  CardViewDetailsButton,
} from "../../../components/cards/base";
import PdfModal from "../../../components/modals/PdfModal";
import PropertyDetailsModal from "../../../components/modals/PropertyDetailsModal/PropertyDetailsModal";
import NegotiationModal from "../../../components/modals/NegotiationModal";
import { KeyTurnLoader } from "../../../components/ui";
import { useDocumentActions } from "../../../../../packages/hooks/data/documents/useDocumentActions";
import {
  usePropertyDetails,
  type Property,
} from "../../../../../packages/hooks/data/search/usePropertyDetails";
import { useSavedHomesStoreIntegration } from "../../../../../packages/hooks/store/search/useSavedHomesStoreIntegration";
import type { SavedHome } from "../../../../../packages/schemas";
import { useUIStore } from "../../../../../packages/store";

type ClientSavedHomesProps = {
  userId: string;
};

export default function ClientSavedHomes({
  userId: _userId,
}: ClientSavedHomesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState(false);
  const [selectedHomeForNegotiation, setSelectedHomeForNegotiation] =
    useState<SavedHome | null>(null);
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  // Use Zustand store for saved homes data (React Query integration)
  // Note: This currently fetches for the authenticated user. Backend API needs to support userId parameter
  const {
    savedHomes: homes,
    savedHomesLoading: loading,
    savedHomesError: error,
    refreshSavedHomes: _refreshSavedHomes,
  } = useSavedHomesStoreIntegration();

  // Use centralized document actions for reports
  const { currentPdf, currentDocumentId, currentDocumentName, closePdfModal } =
    useDocumentActions();

  // Use property details hook for unlock functionality
  const {
    selectedProperty,
    fetchPropertyDetails,
    clearSelectedProperty,
    isLoading: isLoadingPropertyDetails,
  } = usePropertyDetails();

  // Handle unlocking a home
  const handleUnlockHome = useCallback(
    async (home: SavedHome) => {
      const address =
        typeof home.address === "string"
          ? home.address
          : (home.description ?? "");
      if (!address) {
        enqueueToast({
          type: "error",
          message: "Invalid home address",
        });
        return;
      }

      // Convert SavedHome to Property format
      const property: Property = {
        id: home.home_id,
        address: address,
        price:
          typeof home.price === "string"
            ? home.price.startsWith("$")
              ? home.price
              : `$${home.price}`
            : typeof home.price === "number"
              ? `$${home.price.toLocaleString()}`
              : "$0",
        bedrooms: home.bedrooms ?? 0,
        bathrooms: home.bathrooms ?? 0,
        sqft: home.sqft ?? 0,
        lat: home.lat ?? 0,
        lng: home.lng ?? 0,
        latitude: home.lat ?? 0,
        longitude: home.lng ?? 0,
        images: home.image_url ? [home.image_url] : [],
      };

      await fetchPropertyDetails(property);
    },
    [fetchPropertyDetails, enqueueToast]
  );

  // Handle opening negotiation modal
  const handleOpenNegotiation = useCallback((home: SavedHome) => {
    setSelectedHomeForNegotiation(home);
    setIsNegotiationModalOpen(true);
  }, []);

  // Handle closing negotiation modal
  const handleCloseNegotiation = useCallback(() => {
    setIsNegotiationModalOpen(false);
    setSelectedHomeForNegotiation(null);
  }, []);

  // Convert SavedHome to FavoriteHome format for negotiation
  const convertToFavoriteHome = useCallback((home: SavedHome) => {
    return {
      user_id: "",
      address: String(home.address || home.description || ""),
      beds: String(home.bedrooms ?? ""),
      baths: String(home.bathrooms ?? ""),
      sqft: String(home.sqft ?? ""),
      lot_size: typeof home.lot_size === "string" ? home.lot_size : "",
      price:
        typeof home.price === "string"
          ? home.price.startsWith("$")
            ? home.price
            : `$${home.price}`
          : typeof home.price === "number"
            ? `$${home.price.toLocaleString()}`
            : "",
      image_url: home.image_url || "",
      created_at: "",
      updated_at: "",
    };
  }, []);

  const filteredHomes = homes.filter((h: SavedHome) => {
    return (
      h.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.home_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // overlay toast component
  useEffect(() => {
    if (error) enqueueToast({ type: "error", message: error });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  return (
    <div>
      <PdfModal
        currentPdf={currentPdf}
        currentReportAddress={currentDocumentName}
        reportId={currentDocumentId}
        onClose={closePdfModal}
      />
      <div className="space-y-responsive-lg mb-responsive-lg">
        {/* Search bar */}
        <div>
          <input
            type="text"
            placeholder="Search saved homes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive"
          />
        </div>

        {/* Content */}
        {filteredHomes.length === 0 ? (
          loading ? (
            <div className="py-responsive-lg flex justify-center">
              <KeyTurnLoader message="Loading saved homes..." />
            </div>
          ) : (
            <div className="py-responsive-lg text-center">
              <p className="text-responsive-sm text-gray-600">
                No saved homes found.
              </p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-responsive-md sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredHomes.map((home: SavedHome) => {
              return (
                <div key={home.home_id} className="relative group">
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
                      <>
                        {/* Heart save - top-right on image */}
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
                          position="top-right"
                          size="sm"
                        />
                      </>
                    }
                    bottomContent={
                      <div className="flex flex-col gap-2">
                        <CardViewDetailsButton
                          onClick={() => handleUnlockHome(home)}
                          size="sm"
                          variant="primary"
                          fullWidth
                          text="Unlock"
                        />
                        <CardViewDetailsButton
                          onClick={() => handleOpenNegotiation(home)}
                          size="sm"
                          variant="secondary"
                          fullWidth
                          text="Negotiate"
                        />
                      </div>
                    }
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Property Details Modal */}
        {selectedProperty && (
          <PropertyDetailsModal
            property={selectedProperty}
            onClose={clearSelectedProperty}
            isLoading={isLoadingPropertyDetails}
          />
        )}

        {/* Negotiation Modal */}
        <NegotiationModal
          isOpen={isNegotiationModalOpen}
          onClose={handleCloseNegotiation}
          initialHome={
            selectedHomeForNegotiation
              ? convertToFavoriteHome(selectedHomeForNegotiation)
              : null
          }
        />
      </div>
    </div>
  );
}
