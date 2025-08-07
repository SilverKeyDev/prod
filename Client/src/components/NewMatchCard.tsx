import { Star } from "lucide-react";

interface NewMatch {
  address: string;
  dateListed: string; // ISO string YYYY-MM-DD
  matchScore: number; // 0-100
  reason: string;
}

interface NewMatchCardProps {
  item: NewMatch;
}

/**
 * Card component for a newly listed home that matches user preferences.
 */
export default function NewMatchCard({ item }: NewMatchCardProps) {
  const { address, dateListed, matchScore, reason } = item;

  const dateStr = new Date(dateListed).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="border rounded-lg shadow-sm bg-white hover:shadow-md transition p-4 flex flex-col gap-2">
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
  );
}
