import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { useSecureClipboardCopy } from "packages/hooks/ui";
import { ROUTES } from "packages/navigation";
import { useFeedStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";
import { formatCompactNumber } from "packages/utils";
import { getWindow } from "packages/utils/platform";
import { buildPropertyUrl } from "packages/utils/property";
import { tryWebShareUrl } from "packages/utils/share";

import { BodyText } from "@/components/ui";
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
/** Build property-specific share URL with zpid and address slug. Falls back to search page if property data is missing. */
function getPropertyShareUrl(item: FeedListing): string {
  const win = getWindow();
  const base = win?.location?.origin ?? "";

  // Try to build property-specific URL if we have an ID
  if (item.id) {
    try {
      // Use address if available, otherwise use a generic fallback
      const address =
        [item.streetAddress, item.city, item.state, item.zipCode].filter(Boolean).join(" ") ||
        "property";

      return `${base}${buildPropertyUrl(item.id, address)}`;
    } catch {
      // Fall back to search page if URL building fails
    }
  }

  // Fallback to search page
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
  const { t } = useLocalization();
  const copyToClipboard = useSecureClipboardCopy();
  const shareUrl = getPropertyShareUrl(item);
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
    const result = await tryWebShareUrl({
      url: shareUrl,
      title: item.user.name,
    });
    if (result === "unavailable") {
      await copyToClipboard(shareUrl);
    }
  };
  const displayStats = getDisplayStatsForListingId(item.id);
  const displayLikes = Math.max(0, displayStats.likes + (isLiked ? 1 : 0));
  return (
    <Box className="flex flex-col items-center gap-4">
      <FeedActionButton onClick={onLike} label={t("feed.like")}>
        <Box className="flex flex-col items-center gap-1">
          <Icon
            name="heart"
            className={`h-8 w-8 shrink-0 ${isLiked ? "fill-red-500 text-red-500" : "text-white"}`}
          />
          <BodyText as="span" size="xs" className="text-white">
            {formatCompactNumber(displayLikes)}
          </BodyText>
        </Box>
      </FeedActionButton>
      <FeedActionButton onClick={onComment} label={t("feed.comment")}>
        <Box className="flex flex-col items-center gap-1">
          <Icon name="message-circle" className="h-8 w-8 shrink-0 text-white" />
          <BodyText as="span" size="xs" className="text-white">
            {formatCompactNumber(displayStats.comments)}
          </BodyText>
        </Box>
      </FeedActionButton>
      <FeedActionButton onClick={handleShare} label={t("feed.share")}>
        <Box className="flex flex-col items-center gap-1">
          <Icon name="share" className="h-8 w-8 shrink-0 text-white" />
          <BodyText as="span" size="xs" className="text-white">
            {formatCompactNumber(displayStats.shares)}
          </BodyText>
        </Box>
      </FeedActionButton>
      <FeedActionButton
        onClick={handleToggleMute}
        label={userHasUnmuted ? t("feed.mute") : t("feed.unmute")}
      >
        {userHasUnmuted ? (
          <Icon name="volume-2" className="h-8 w-8 shrink-0 text-white" />
        ) : (
          <Icon name="volume-x" className="h-8 w-8 shrink-0 text-white" />
        )}
      </FeedActionButton>
      <FeedActionButton onClick={onSave} label={t("feed.save")}>
        <Icon name="bookmark" className="h-8 w-8 shrink-0 text-white" />
      </FeedActionButton>
      <FeedActionButton onClick={onMore} label={t("feed.more")}>
        <Icon name="more-horizontal" className="h-8 w-8 shrink-0 text-white" />
      </FeedActionButton>
    </Box>
  );
}
