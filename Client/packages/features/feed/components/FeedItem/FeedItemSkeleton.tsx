import { Image } from "packages/ui/components/primitives/media";

import { FeedPosterPlaceholder } from "./FeedPosterPlaceholder";

type FeedItemSkeletonProps = {
  thumbnailUrl?: string;
};

/**
 * Blurred placeholder for video loading state. Fills container to match video layout.
 * Shows blurred thumbnail when provided, otherwise generic placeholder.
 * On poster failure, shows branded placeholder.
 */
export function FeedItemSkeleton({ thumbnailUrl }: FeedItemSkeletonProps = {}) {
  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-neutral-800">
      {thumbnailUrl ? (
        <>
          <Image
            src={thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
          <div className="absolute inset-0 hidden">
            <FeedPosterPlaceholder />
          </div>
        </>
      ) : (
        <div className="absolute inset-0 animate-pulse bg-neutral-700/50 blur-sm" />
      )}
    </div>
  );
}
