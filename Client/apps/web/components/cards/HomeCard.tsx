import { useNavigate } from "react-router-dom";

import {
  type Property,
  usePropertyDetails,
} from "packages/hooks/data/search/property/usePropertyDetails";
import {
  formatFilenameToAddress,
  formatLotSize,
  truncateText,
} from "packages/utils/domain/search/address";

import { ModalPortal, PropertyDetailsModal } from "@/components/modals";

import {
  CardHeartSave,
  CardViewDetailsButton,
  TrianglePointer,
} from "./base/index.web";
import PropertyCard from "./PropertyCard";

export type HomeDescription = {
  home_id: string;
  description?: string;
  image_url?: string;
  calculatedScore?: number;
  address?: string;
  price?: string | number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lot_size?: string | number;
  lat?: number;
  lng?: number;
  [key: string]: unknown;
};

type HomeCardProps = {
  home: HomeDescription;
  showScore?: boolean;
  isOnMap?: boolean;
  onFocus?: (property: Property) => void;
};

function convertHomeToProperty(
  home: HomeDescription,
  formattedAddress: string,
): Property {
  const lat = home.lat ?? 37.7749;
  const lng = home.lng ?? -122.4194;
  return {
    id: home.home_id,
    address: home.address ?? formattedAddress ?? home.home_id,
    price:
      typeof home.price === "string"
        ? home.price.startsWith("$")
          ? home.price
          : `$${home.price}`
        : typeof home.price === "number"
          ? `$${home.price.toLocaleString()}`
          : "Price not available",
    bedrooms: home.bedrooms ?? 3,
    bathrooms: home.bathrooms ?? 2,
    sqft: home.sqft ?? 1500,
    lat,
    lng,
    latitude: lat,
    longitude: lng,
    images: home.image_url ? [home.image_url] : undefined,
  };
}

function formatHomePrice(price: string | number | undefined): string {
  if (typeof price === "number") return `$${price.toLocaleString()}`;
  if (typeof price === "string" && !price.startsWith("$")) return `$${price}`;
  return (price as string) ?? "N/A";
}

type HomeCardViewProps = {
  isOnMap: boolean;
  onCardClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  home: HomeDescription;
  displayName: string;
  price: string;
  score: number | undefined;
  showScore: boolean;
  property: Property;
  onViewDetails: () => Promise<void>;
  selectedProperty: Property | null;
  onCloseModal: () => void;
  onGenerateReport: (address: string) => void;
  isLoadingPropertyDetails: boolean;
};

function HomeCardView({
  isOnMap,
  onCardClick,
  onKeyDown,
  home,
  displayName,
  price,
  score,
  showScore,
  property,
  onViewDetails,
  selectedProperty,
  onCloseModal,
  onGenerateReport,
  isLoadingPropertyDetails,
}: HomeCardViewProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={`relative cursor-pointer ${isOnMap ? "scale-90 transform" : ""}`}
      onClick={onCardClick}
      onKeyDown={onKeyDown}
    >
      <TrianglePointer show={isOnMap} />
      <PropertyCard
        id={home.home_id}
        imageUrl={home.image_url}
        address={displayName}
        price={price}
        bedrooms={home.bedrooms as number | undefined}
        bathrooms={home.bathrooms as number | undefined}
        sqft={home.sqft && home.sqft > 0 ? home.sqft : undefined}
        lotSize={formatLotSize(home.lot_size as string | number | undefined)}
        pricePosition="below-address"
        cardType="searchpage"
        score={score}
        showScore={showScore}
        isOnMap={isOnMap}
        topContent={
          <CardHeartSave property={property} size="sm" position="top-right" />
        }
        bottomContent={
          <CardViewDetailsButton
            onClick={onViewDetails}
            size="sm"
            variant="unlock"
            fullWidth
            text="Unlock"
          />
        }
      />
      {selectedProperty && (
        <ModalPortal>
          <PropertyDetailsModal
            property={selectedProperty}
            onClose={onCloseModal}
            onGenerateReport={onGenerateReport}
            isLoading={isLoadingPropertyDetails}
          />
        </ModalPortal>
      )}
    </div>
  );
}

export default function HomeCard({
  home,
  showScore = false,
  isOnMap = false,
  onFocus,
}: HomeCardProps) {
  const {
    selectedProperty,
    fetchPropertyDetails,
    clearSelectedProperty,
    isLoading: isLoadingPropertyDetails,
  } = usePropertyDetails();
  const navigate = useNavigate();
  const formattedAddress = formatFilenameToAddress(home.home_id);
  const displayName = truncateText(
    home.address ?? formattedAddress ?? `Home ${home.home_id}`,
    35,
  );
  const property = convertHomeToProperty(home, formattedAddress);
  const score = showScore ? home.calculatedScore : undefined;
  const price = formatHomePrice(home.price);

  const handleViewDetails = async () => {
    await fetchPropertyDetails(property);
  };

  const handleGenerateReport = (address: string) => {
    localStorage.setItem(
      "generateReportState",
      JSON.stringify({
        address,
        reportType: "detailed",
        selectedClientId: "",
      }),
    );
    void navigate("/saved");
  };

  const handleCardClick = () => onFocus?.(property);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <HomeCardView
      isOnMap={isOnMap}
      onCardClick={handleCardClick}
      onKeyDown={handleKeyDown}
      home={home}
      displayName={displayName}
      price={price}
      score={score}
      showScore={showScore}
      property={property}
      onViewDetails={handleViewDetails}
      selectedProperty={selectedProperty ?? null}
      onCloseModal={clearSelectedProperty}
      onGenerateReport={handleGenerateReport}
      isLoadingPropertyDetails={isLoadingPropertyDetails}
    />
  );
}
