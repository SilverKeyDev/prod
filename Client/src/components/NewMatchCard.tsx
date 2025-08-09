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
      <div className="w-full h-40 bg-gray-100 overflow-hidden">
        <img
          src={imageUrl || placeholder}
          alt={address}
          className="object-cover w-full h-full"
          loading="lazy"
        />
      </div>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base line-clamp-2" title={address}>
            {address}
          </h3>
          <div className="flex items-center gap-1 text-brown">
            <Star size={18} />
            <span className="font-medium">{matchScore}/100</span>
          </div>
        </div>
        <p className="text-sm text-gray-600">Listed on {dateStr}</p>
        <p className="text-sm text-gray-700 line-clamp-3">{reason}</p>
      </div>
    </div>
  );
}
