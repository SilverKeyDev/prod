import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share,
  Volume2,
  VolumeX,
} from "lucide-react";

import { useSecureClipboardCopy } from "packages/hooks/ui";
import { ROUTES } from "packages/schemas/app/nav";
import type { FeedListing } from "packages/schemas/content/feed/feed";
import { useFeedStore } from "packages/store";
import { formatCompactNumber } from "packages/utils";

import { BodyText } from "@/components/ui/index.web";

import { FeedActionButton } from "./FeedActionButton";

type FeedActionStackProps = {
  item: FeedListing;
  isLiked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onMore?: () => void;
};

function buildFeedDeepLink(listingId: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}${ROUTES.SEARCH}?reels&feed=${encodeURIComponent(listingId)}`;
}

export function FeedActionStack({
  item,
  isLiked = false,
  onLike,
  onComment,
  onShare,
  onSave,
  onMore,
}: FeedActionStackProps) {
  const copyToClipboard = useSecureClipboardCopy();
  const shareUrl = buildFeedDeepLink(item.id);
  const userHasUnmuted = useFeedStore((s) => s.userHasUnmuted);
  const setUserHasUnmuted = useFeedStore((s) => s.setUserHasUnmuted);

  const handleToggleMute = () => {
    setUserHasUnmuted(!userHasUnmuted);
  };

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.user.name,
          url: shareUrl,
        });
      } catch {
        await copyToClipboard(shareUrl);
      }
    } else {
      await copyToClipboard(shareUrl);
    }
  };

  const displayLikes = Math.max(0, item.stats.likes + (isLiked ? 1 : 0));

  return (
    <div className="flex flex-col items-center gap-4">
      <FeedActionButton onClick={onLike} label="Like">
        <div className="flex flex-col items-center gap-1">
          <Heart
            className={`h-8 w-8 shrink-0 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
          />
          <BodyText as="span" size="xs" className="text-white">
            {formatCompactNumber(displayLikes)}
          </BodyText>
        </div>
      </FeedActionButton>
      <FeedActionButton onClick={onComment} label="Comment">
        <div className="flex flex-col items-center gap-1">
          <MessageCircle className="h-8 w-8 shrink-0" />
          <BodyText as="span" size="xs" className="text-white">
            {formatCompactNumber(item.stats.comments)}
          </BodyText>
        </div>
      </FeedActionButton>
      <FeedActionButton onClick={handleShare} label="Share">
        <Share className="h-8 w-8 shrink-0" />
      </FeedActionButton>
      <FeedActionButton
        onClick={handleToggleMute}
        label={userHasUnmuted ? "Mute" : "Unmute"}
      >
        {userHasUnmuted ? (
          <Volume2 className="h-8 w-8 shrink-0" />
        ) : (
          <VolumeX className="h-8 w-8 shrink-0" />
        )}
      </FeedActionButton>
      <FeedActionButton onClick={onSave} label="Save">
        <Bookmark className="h-8 w-8 shrink-0" />
      </FeedActionButton>
      <FeedActionButton onClick={onMore} label="More">
        <MoreHorizontal className="h-8 w-8 shrink-0" />
      </FeedActionButton>
    </div>
  );
}
