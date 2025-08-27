import { Star } from "lucide-react";

interface NewMatch {
  address: string;
  dateListed: string; // ISO string YYYY-MM-DD
  matchScore: number; // 0-100
  reason: string;
  imageUrl?: string;
}

interface NewMatchCardProps {
  item: NewMatch;
}

/**
 * Card component for a newly listed home that matches user preferences.
 */
export default function NewMatchCard({ item }: NewMatchCardProps) {
  const { address, dateListed, matchScore, reason, imageUrl } = item;

  const dateStr = new Date(dateListed).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
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
        <div className="flex items-start justify-between gap-responsive-sm">
          <h3 className="font-semibold text-responsive-xs line-clamp-1 flex-1 truncate" title={address}>
            {address}
          </h3>
          <div className="flex items-center gap-responsive-xs text-brown flex-shrink-0">
            <Star className="mobile-icon-sm" />
            <span className="font-medium text-responsive-xs whitespace-nowrap">{matchScore}/100</span>
          </div>
        </div>
        <p className="text-responsive-xs text-gray-600 truncate">Listed on {dateStr}</p>
        <p className="text-responsive-xs text-gray-700 line-clamp-2">{reason}</p>
      </div>
    </div>
  );
}
