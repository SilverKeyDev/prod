import { Box, Image } from "packages/ui/components/primitives";

import { BodyText, Button } from "@/components/ui";
import { FeedAffordabilityBadge } from "@/features/feed/components/Modals/FeedAffordabilityBadge";
import type { FeedListing } from "@/features/feed/types/feed";
import { DEFAULT_AVATAR_IMAGE } from "@/features/feed/utils";

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
    <Box
      className={
        embedded
          ? "min-w-0 flex-1 overflow-hidden p-4 text-white"
          : "absolute bottom-0 left-0 right-0 p-4 pb-20 text-white md:pb-24"
      }
    >
      <Box className="mb-2 flex flex-wrap items-center gap-2">
        <FeedAffordabilityBadge item={item} />
      </Box>
      <Box className="flex items-end justify-between gap-4">
        <Box className="min-w-0 flex-1">
          {musicTitle && (
            <Box className="mb-2 overflow-hidden">
              <Box
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
              </Box>
            </Box>
          )}
          <Box className="flex items-center gap-2">
            <Image
              src={item.user.avatarUrl ?? DEFAULT_AVATAR_IMAGE}
              alt=""
              className={`h-8 w-8 ${FEED_AVATAR_IMAGE_CLASS}`}
            />
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
                className="bg-text-secondary rounded px-1.5 py-0.5 text-white"
              >
                Sponsored
              </BodyText>
            )}
          </Box>
          <FeedPrice price={item.price} />
          <FeedFeatureTags features={item.features} />
          <FeedLocation city={item.city} state={item.state} />
        </Box>
        <Box className="flex shrink-0 items-center gap-2">
          {onFollow && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFollow}
              className="hover:bg-background-surface/20 border-white/50 text-white"
            >
              Follow
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
