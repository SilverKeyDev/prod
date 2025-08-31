import { CardAddressDisplay, CardPriceDrop, CardImageContainer, CardContentContainer } from "./base";

interface PriceDrop {
  address: string;
  oldPrice: number;
  newPrice: number;
  imageUrl?: string;
}

interface PriceDropCardProps {
  item: PriceDrop;
}

/**
 * Presentation component for a home price-drop notification.
 * Matches card aesthetics used elsewhere (border, shadow, rounded corners).
 */
export default function PriceDropCard({ item }: PriceDropCardProps) {
  const { address, oldPrice, newPrice, imageUrl } = item;

  return (
    <div className="card-standard overflow-hidden flex flex-col">
      {/* Image */}
      <CardImageContainer
        imageUrl={imageUrl}
        alt={address}
        height="responsive"
      />

      {/* Details */}
      <CardContentContainer padding="sm" className="flex-1 flex flex-col gap-responsive-sm card-content-spacing">
        <CardAddressDisplay
          address={address}
          size="xs"
          showIcon={false}
        />
        <CardPriceDrop
          oldPrice={oldPrice}
          newPrice={newPrice}
          size="sm"
        />
      </CardContentContainer>
    </div>
  );
}
