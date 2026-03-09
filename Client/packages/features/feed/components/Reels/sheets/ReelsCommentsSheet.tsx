import { useCallback, useState } from "react";

import { Icon } from "@ui/icons";

import { Transition } from "packages/ui/components/adapters/headless";
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
    <Transition show={isOpen} as="div">
      <AccessibleDialog onClose={onClose} className="relative z-50" label="Comments">
        <Transition.Child
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden onClick={onClose} />
        </Transition.Child>
        <div className="pointer-events-none fixed inset-0 flex items-end justify-center p-0">
          <Transition.Child
            enter="ease-out duration-200"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
          >
            <AccessibleDialog.Panel
              className="pointer-events-auto flex h-[75dvh] max-h-[75dvh] w-full flex-col rounded-t-2xl bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header — Instagram: "Comments" with top drag handle */}
              <div className="flex shrink-0 flex-col items-center border-b border-neutral-200 pt-2">
                <div className="mb-2 h-1 w-10 rounded-full bg-neutral-300" aria-hidden />
                <div className="flex w-full items-center justify-between gap-2 px-4 pb-3">
                  <div className="w-9 shrink-0" aria-hidden />
                  <Title size="sm" as="h2" className="flex-1 text-center">
                    Comments
                  </Title>
                  <div className="flex w-9 shrink-0 justify-end">
                    <CloseButton onClick={onClose} size="sm" label="Close comments" />
                  </div>
                </div>
              </div>

              {/* Scrollable comment list */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-12">
                    <BodyText size="sm" muted className="text-center">
                      No comments yet.
                    </BodyText>
                    <BodyText size="sm" muted className="mt-1 text-center">
                      Be the first to comment.
                    </BodyText>
                  </div>
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {comments.map((comment) => (
                      <li key={comment.id} className="flex gap-3 px-4 py-3">
                        <div className="shrink-0">
                          <Image
                            src={comment.user.avatarUrl ?? DEFAULT_AVATAR_IMAGE}
                            alt=""
                            className={`h-8 w-8 ${FEED_AVATAR_IMAGE_CLASS}`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <BodyText as="p" size="sm" className="text-neutral-900">
                            <BodyText as="span" size="sm" className="font-semibold">
                              {comment.user.name}
                            </BodyText>{" "}
                            <BodyText as="span" size="sm" className="font-normal">
                              {comment.text}
                            </BodyText>
                          </BodyText>
                          <div className="mt-1 flex items-center gap-4">
                            <BodyText as="span" size="xs" className="text-neutral-500">
                              {formatCommentTime(comment.createdAt)}
                            </BodyText>
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-neutral-500 hover:text-neutral-700"
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
                                  className="text-neutral-400"
                                  aria-hidden
                                >
                                  ·
                                </BodyText>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  className="flex items-center gap-1 text-neutral-500 hover:text-neutral-700"
                                  label="Like comment"
                                >
                                  <Icon name="heart" className="h-3.5 w-3.5" />
                                  <BodyText as="span" size="xs">
                                    {formatCompactCount(comment.likes)}
                                  </BodyText>
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-neutral-400 hover:text-neutral-600"
                          icon={<Icon name="heart" className="h-4 w-4" />}
                          label="Like comment"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Bottom input bar — Instagram: avatar + input + Post */}
              {item && (
                <div className="flex shrink-0 items-center gap-2 border-t border-neutral-200 px-4 py-3">
                  <Image
                    src={currentUser?.avatarUrl ?? DEFAULT_AVATAR_IMAGE}
                    alt=""
                    className={`h-8 w-8 shrink-0 ${FEED_AVATAR_IMAGE_CLASS}`}
                  />
                  <AccessibleTextInput
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Add a comment..."
                    className="min-w-0 flex-1 border-0 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-0"
                    label="Add a comment"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!canPost}
                    onClick={handlePost}
                    className={
                      canPost
                        ? "text-brand-accent hover:text-brand-accent/80 font-semibold hover:bg-transparent"
                        : "font-semibold text-neutral-400"
                    }
                  >
                    Post
                  </Button>
                </div>
              )}
            </AccessibleDialog.Panel>
          </Transition.Child>
        </div>
      </AccessibleDialog>
    </Transition>
  );
}
