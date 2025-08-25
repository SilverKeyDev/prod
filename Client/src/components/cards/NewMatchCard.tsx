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
    <div className="border rounded-lg shadow-sm bg-white hover:shadow-md transition overflow-hidden flex flex-col">
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
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2 flex-1" title={address}>
            {address}
          </h3>
          <div className="flex items-center gap-1 text-brown flex-shrink-0">
            <Star size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="font-medium text-sm sm:text-base">{matchScore}/100</span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-600">Listed on {dateStr}</p>
        <p className="text-xs sm:text-sm text-gray-700 line-clamp-2 sm:line-clamp-3">{reason}</p>
      </div>
    </div>
  );
}
