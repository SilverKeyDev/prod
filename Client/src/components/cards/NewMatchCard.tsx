import {
  CardAddressDisplay,
  CardMatchScore,
  CardImageContainer,
  CardContentContainer,
} from "./base";

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

  return (
    <div className="card-standard overflow-hidden flex flex-col">
      {/* Image */}
      <CardImageContainer
        imageUrl={imageUrl}
        alt={address}
        height="responsive"
      />

      {/* Details */}
      <CardContentContainer
        padding="sm"
        className="flex-1 flex flex-col gap-responsive-sm card-content-spacing"
      >
        <div className="flex items-start justify-between gap-responsive-sm">
          <CardAddressDisplay
            address={address}
            size="xs"
            showIcon={false}
            className="flex-1"
          />
          <CardMatchScore score={matchScore} size="sm" />
        </div>
        <p className="text-responsive-xs text-gray-600 truncate">
          Listed on {dateStr}
        </p>
        <p className="text-responsive-xs text-gray-700 line-clamp-2">
          {reason}
        </p>
      </CardContentContainer>
    </div>
  );
}
