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
      <div className="w-full h-32 sm:h-36 md:h-40 bg-gray-100 overflow-hidden">
        <img
          src={imageUrl || placeholder}
          alt={address}
          className="object-cover w-full h-full"
          loading="lazy"
        />
      </div>

      {/* Details */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col gap-1.5 sm:gap-2">
        <h3 className="font-semibold text-2xs sm:text-xs md:text-sm line-clamp-1 truncate" title={address}>
          {address}
        </h3>
        <div className="flex items-center gap-1 text-2xs sm:text-xs text-red-600 font-medium">
          <ArrowDownRight size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="whitespace-nowrap">{percent}% price drop</span>
        </div>
        <p className="text-2xs sm:text-xs text-gray-700 truncate">
          {formatter.format(oldPrice)} → {formatter.format(newPrice)}
        </p>
      </div>
    </div>
  );
}
