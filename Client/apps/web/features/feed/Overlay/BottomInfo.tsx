import type { FeedListing } from "packages/schemas/content/feed/feed";

import { BodyText, Button, Image } from "@/components/ui/index.web";
import { FeedAffordabilityBadge } from "@/features/feed/Modals/FeedAffordabilityBadge";

import { FEED_AVATAR_IMAGE_CLASS } from "./FeedActionButton";
import { FeedFeatureTags } from "./FeedFeatureTags";
import { FeedLocation } from "./FeedLocation";
import { FeedPrice } from "./FeedPrice";

type BottomInfoProps = {
  item: FeedListing;
  isSponsored?: boolean;
  isVerified?: boolean;
  onFollow?: () => void;
  /** When true, render as content only (no absolute positioning or overlap padding). */
  embedded?: boolean;
};

export function BottomInfo({
  item,
  isSponsored = false,
  isVerified = false,
  onFollow,
  embedded = false,
}: BottomInfoProps) {
  const musicTitle = item.music
    ? `${item.music.title}${item.music.artist ? ` - ${item.music.artist}` : ""}`
    : null;

  return (
    <div
      className={
        embedded
          ? "min-w-0 flex-1 overflow-hidden p-4 text-white"
          : "absolute bottom-0 left-0 right-0 p-4 pb-20 text-white md:pb-24"
      }
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <FeedAffordabilityBadge item={item} />
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          {musicTitle && (
            <div className="mb-2 overflow-hidden">
              <div
                className={`inline-flex whitespace-nowrap ${
                  musicTitle.length > 30 ? "animate-marquee" : ""
                }`}
                style={
                  musicTitle.length > 30
                    ? { width: "max-content", paddingRight: "2rem" }
                    : undefined
                }
                title={musicTitle}
              >
                <BodyText as="span" size="sm" className="text-white/90">
                  {musicTitle}
                  {musicTitle.length > 30 && ` • ${musicTitle}`}
                </BodyText>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            {item.user.avatarUrl ? (
              <Image
                src={item.user.avatarUrl}
                alt=""
                className={`h-8 w-8 ${FEED_AVATAR_IMAGE_CLASS}`}
              />
            ) : (
              <div
                className={`h-8 w-8 bg-white/20 ${FEED_AVATAR_IMAGE_CLASS}`}
              />
            )}
            <BodyText as="span" size="sm" className="font-medium text-white">
              {item.user.name}
            </BodyText>
            {isVerified && (
              <BodyText
                as="span"
                size="xs"
                className="rounded bg-blue-500/80 px-1.5 py-0.5 text-white"
              >
                Verified
              </BodyText>
            )}
            {isSponsored && (
              <BodyText
                as="span"
                size="xs"
                className="rounded bg-neutral-600/80 px-1.5 py-0.5 text-white"
              >
                Sponsored
              </BodyText>
            )}
          </div>
          <FeedPrice price={item.price} />
          <FeedFeatureTags features={item.features} />
          <FeedLocation city={item.city} state={item.state} />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onFollow && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFollow}
              className="border-white/50 text-white hover:bg-white/20"
            >
              Follow
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
