import { ArrowDownRight } from "lucide-react";

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
  const percent = Math.round(((oldPrice - newPrice) / oldPrice) * 100);

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const placeholder = "https://placehold.co/600x400?text=No+Image";

  return (
    <div className="card-mobile overflow-hidden flex flex-col">
      {/* Image */}
      <div className="w-full bg-gray-100 overflow-hidden" style={{height: 'clamp(8rem, 12vw, 10rem)'}}>
        <img
          src={imageUrl || placeholder}
          alt={address}
          className="object-cover w-full h-full"
          loading="lazy"
        />
      </div>

      {/* Details */}
      <div className="space-responsive-sm flex-1 flex flex-col gap-responsive-sm">
        <h3 className="font-semibold text-responsive-xs line-clamp-1 truncate" title={address}>
          {address}
        </h3>
        <div className="flex items-center gap-responsive-xs text-responsive-xs text-red-600 font-medium">
          <ArrowDownRight className="mobile-icon-sm flex-shrink-0" />
          <span className="whitespace-nowrap">{percent}% price drop</span>
        </div>
        <p className="text-responsive-xs text-gray-700 truncate">
          {formatter.format(oldPrice)} → {formatter.format(newPrice)}
        </p>
      </div>
    </div>
  );
}
