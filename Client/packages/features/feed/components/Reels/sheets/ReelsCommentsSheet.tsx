import { useCallback, useState } from "react";

import { Icon } from "@ui/icons";

import { Transition } from "packages/ui/components/adapters/headless";
import { Box } from "packages/ui/components/primitives";
import { formatCompactCount } from "packages/utils";
import { dateNow, dateParseISO } from "packages/utils/date";

import {
  AccessibleDialog,
  AccessibleTextInput,
  BodyText,
  Button,
  CloseButton,
  IconButton,
  Image,
  Title,
} from "@/components/ui";
import { FEED_AVATAR_IMAGE_CLASS } from "@/features/feed/components/Overlay/FeedActionButton";
import type { FeedComment, FeedListing } from "@/features/feed/types/feed";
import { DEFAULT_AVATAR_IMAGE } from "@/features/feed/utils";
function formatCommentTime(createdAt: string): string {
  const date = dateParseISO(createdAt);
  const now = dateNow();
  const diffMs = now.valueOf() - date.valueOf();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 52) return `${diffWeeks}w`;
  return date.toDate().toLocaleDateString();
}
type ReelsCommentsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  item: FeedListing | null;
  /** Initial comments (e.g. from API). Can be empty. */
  comments: FeedComment[];
  /** Callback when user submits a new comment. Optional for UI-only. */
  onAddComment?: (text: string) => void;
  /** Current user for the add-comment row (avatar + label). Optional. */
  currentUser?: {
    name: string;
    avatarUrl?: string;
  };
};
export function ReelsCommentsSheet({
  isOpen,
  onClose,
  item,
  comments,
  onAddComment,
  currentUser,
}: ReelsCommentsSheetProps) {
  const [draft, setDraft] = useState("");
  const canPost = draft.trim().length > 0;
  const handlePost = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    onAddComment?.(text);
    setDraft("");
  }, [draft, onAddComment]);
  return (
    <Transition show={isOpen} as={Box}>
      <AccessibleDialog
        onClose={onClose}
        className="z-modal relative"
        label="Comments"
      >
        {}
        <Transition.Child
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Box
            className="bg-overlay-backdrop fixed inset-0"
            aria-hidden
            onClick={onClose}
          />
        </Transition.Child>
        {}
        <Box className="pointer-events-none fixed inset-0 flex flex-row items-end justify-center p-0">
          {}
          <Transition.Child
            enter="ease-out duration-200"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
          >
            <AccessibleDialog.Panel
              className="bg-background-surface pointer-events-auto flex min-h-0 w-full flex-[0.75] flex-row flex-col rounded-t-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Instagram: "Comments" with top drag handle */}
              <Box className="border-border flex shrink-0 flex-row flex-col items-center border-b pt-2">
                <Box
                  className="bg-border mb-2 h-1 w-10 rounded-full"
                  aria-hidden
                />
                <Box className="flex w-full flex-row items-center justify-between gap-2 px-4 pb-3">
                  <Box className="w-9 shrink-0" aria-hidden />
                  <Title size="sm" as="h2" className="flex-1 text-center">
                    Comments
                  </Title>
                  <Box className="flex w-9 shrink-0 flex-row justify-end">
                    <CloseButton
                      onClick={onClose}
                      size="sm"
                      label="Close comments"
                    />
                  </Box>
                </Box>
              </Box>

              {/* Scrollable comment list */}
              <Box className="min-h-0 flex-1 overflow-y-auto">
                {comments.length === 0 ? (
                  <Box className="flex flex-row flex-col items-center justify-center px-4 py-12">
                    <BodyText size="sm" muted className="text-center">
                      No comments yet.
                    </BodyText>
                    <BodyText size="sm" muted className="mt-1 text-center">
                      Be the first to comment.
                    </BodyText>
                  </Box>
                ) : (
                  <ul className="divide-border divide-y">
                    {comments.map((comment) => (
                      <li
                        key={comment.id}
                        className="flex flex-row gap-3 px-4 py-3"
                      >
                        <Box className="shrink-0">
                          <Image
                            src={comment.user.avatarUrl ?? DEFAULT_AVATAR_IMAGE}
                            alt=""
                            className={`h-8 w-8 ${FEED_AVATAR_IMAGE_CLASS}`}
                          />
                        </Box>
                        <Box className="min-w-0 flex-1">
                          <BodyText
                            as="p"
                            size="sm"
                            className="text-text-primary"
                          >
                            <BodyText
                              as="span"
                              size="sm"
                              className="font-semibold"
                            >
                              {comment.user.name}
                            </BodyText>{" "}
                            <BodyText
                              as="span"
                              size="sm"
                              className="font-normal"
                            >
                              {comment.text}
                            </BodyText>
                          </BodyText>
                          <Box className="mt-1 flex flex-row items-center gap-4">
                            <BodyText
                              as="span"
                              size="xs"
                              className="text-text-secondary"
                            >
                              {formatCommentTime(comment.createdAt)}
                            </BodyText>
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-text-secondary hover:text-text-primary active:text-text-primary"
                            >
                              <BodyText as="span" size="xs">
                                Reply
                              </BodyText>
                            </Button>
                            {comment.likes != null && comment.likes > 0 && (
                              <>
                                <BodyText
                                  as="span"
                                  size="xs"
                                  className="text-text-disabled"
                                  aria-hidden
                                >
                                  ·
                                </BodyText>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  className="text-text-secondary hover:text-text-primary active:text-text-primary flex flex-row items-center gap-1"
                                  label="Like comment"
                                >
                                  <Icon name="heart" className="h-3.5 w-3.5" />
                                  <BodyText as="span" size="xs">
                                    {formatCompactCount(comment.likes)}
                                  </BodyText>
                                </Button>
                              </>
                            )}
                          </Box>
                        </Box>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          className="text-text-disabled hover:text-text-secondary active:text-text-secondary active:text-text-primary shrink-0"
                          icon={<Icon name="heart" className="h-4 w-4" />}
                          label="Like comment"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </Box>

              {/* Bottom input bar - Instagram: avatar + input + Post */}
              {item && (
                <Box className="border-border flex shrink-0 flex-row items-center gap-2 border-t px-4 py-3">
                  <Image
                    src={currentUser?.avatarUrl ?? DEFAULT_AVATAR_IMAGE}
                    alt=""
                    className={`h-8 w-8 shrink-0 ${FEED_AVATAR_IMAGE_CLASS}`}
                  />
                  <AccessibleTextInput
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Add a comment..."
                    className="text-text-primary placeholder:text-text-secondary min-w-0 flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
                    label="Add a comment"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!canPost}
                    onClick={handlePost}
                    className={
                      canPost
                        ? "text-primary hover:text-primary active:text-primary font-semibold hover:bg-transparent active:bg-transparent"
                        : "text-text-disabled font-semibold"
                    }
                  >
                    Post
                  </Button>
                </Box>
              )}
            </AccessibleDialog.Panel>
          </Transition.Child>
          {}
        </Box>
      </AccessibleDialog>
    </Transition>
  );
}
