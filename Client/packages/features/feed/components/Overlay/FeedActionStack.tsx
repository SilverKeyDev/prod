import { Icon } from "@ui/icons";

import { useSecureClipboardCopy } from "packages/hooks/ui";
import { ROUTES } from "packages/navigation";
import { useFeedStore } from "packages/store";
import { BodyText } from "packages/ui/components/index.web";
import { formatCompactNumber } from "packages/utils";
import { getNavigator, getWindow } from "packages/utils/platform";

import type { FeedListing } from "@/features/feed/types/feed";
import { getDisplayStatsForListingId } from "@/features/feed/utils/feedDisplayStats";

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
/** Search page URL for share/copy (no reel-specific params). */
function getSearchPageShareUrl(): string {
  const win = getWindow();
  const base = win?.location?.origin ?? "";
  return `${base}${ROUTES.SEARCH}`;
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
  const shareUrl = getSearchPageShareUrl();
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
    const nav = getNavigator();
    if (nav?.share) {
      try {
        await nav.share({
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
  const displayStats = getDisplayStatsForListingId(item.id);
  const displayLikes = Math.max(0, displayStats.likes + (isLiked ? 1 : 0));
  return (
    <div className="flex flex-col items-center gap-4">
      <FeedActionButton onClick={onLike} label="Like">
        <div className="flex flex-col items-center gap-1">
          <Icon
            name="heart"
            className={`h-8 w-8 shrink-0 ${isLiked ? "fill-red-500 text-red-500" : "text-white"}`}
          />
          <BodyText as="span" size="xs" className="text-white">
            {formatCompactNumber(displayLikes)}
          </BodyText>
        </div>
      </FeedActionButton>
      <FeedActionButton onClick={onComment} label="Comment">
        <div className="flex flex-col items-center gap-1">
          <Icon name="message-circle" className="h-8 w-8 shrink-0 text-white" />
          <BodyText as="span" size="xs" className="text-white">
            {formatCompactNumber(displayStats.comments)}
          </BodyText>
        </div>
      </FeedActionButton>
      <FeedActionButton onClick={handleShare} label="Share">
        <div className="flex flex-col items-center gap-1">
          <Icon name="share" className="h-8 w-8 shrink-0 text-white" />
          <BodyText as="span" size="xs" className="text-white">
            {formatCompactNumber(displayStats.shares)}
          </BodyText>
        </div>
      </FeedActionButton>
      <FeedActionButton onClick={handleToggleMute} label={userHasUnmuted ? "Mute" : "Unmute"}>
        {userHasUnmuted ? (
          <Icon name="volume-2" className="h-8 w-8 shrink-0 text-white" />
        ) : (
          <Icon name="volume-x" className="h-8 w-8 shrink-0 text-white" />
        )}
      </FeedActionButton>
      <FeedActionButton onClick={onSave} label="Save">
        <Icon name="bookmark" className="h-8 w-8 shrink-0 text-white" />
      </FeedActionButton>
      <FeedActionButton onClick={onMore} label="More">
        <Icon name="more-horizontal" className="h-8 w-8 shrink-0 text-white" />
      </FeedActionButton>
    </div>
  );
}
