import { Icon } from "@ui/icons";

import { Transition } from "packages/ui/components/adapters/headless";
import {
  AccessibleDialog,
  BodyText,
  Button,
  CloseButton,
  Title,
} from "packages/ui/components/index.web";

import type { FeedListing } from "@/features/feed/types/feed";
export type ReelsMoreActionId = "not-interested" | "report" | "copy-link" | "save";
type ReelsMoreSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  item: FeedListing | null;
  isSaved?: boolean;
  onNotInterested?: () => void;
  onReport?: () => void;
  onCopyLink?: () => void;
  onSave?: () => void;
};
const ACTION_ROW_CLASS =
  "flex w-full items-center gap-3 px-4 py-3 text-left border-0 rounded-none bg-transparent hover:bg-neutral-50 active:bg-neutral-100 text-neutral-900";
export function ReelsMoreSheet({
  isOpen,
  onClose,
  item: _item,
  isSaved = false,
  onNotInterested,
  onReport,
  onCopyLink,
  onSave,
}: ReelsMoreSheetProps) {
  const handleNotInterested = () => {
    onNotInterested?.();
    onClose();
  };
  const handleReport = () => {
    onReport?.();
    onClose();
  };
  const handleCopyLink = () => {
    onCopyLink?.();
    onClose();
  };
  const handleSave = () => {
    onSave?.();
    onClose();
  };
  return (
    <Transition show={isOpen} as="div">
      <AccessibleDialog onClose={onClose} className="relative z-50" label="More options">
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
              {/* Header — same pattern as Comments: drag handle + title + close */}
              <div className="flex shrink-0 flex-col items-center border-b border-neutral-200 pt-2">
                <div className="mb-2 h-1 w-10 rounded-full bg-neutral-300" aria-hidden />
                <div className="flex w-full items-center justify-between gap-2 px-4 pb-3">
                  <div className="w-9 shrink-0" aria-hidden />
                  <Title size="sm" as="h2" className="flex-1 text-center">
                    More
                  </Title>
                  <div className="flex w-9 shrink-0 justify-end">
                    <CloseButton onClick={onClose} size="sm" label="Close more options" />
                  </div>
                </div>
              </div>

              {/* Action list */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="py-2">
                  <Button
                    variant="ghost"
                    size="md"
                    className={ACTION_ROW_CLASS}
                    onClick={handleNotInterested}
                    label="Not interested"
                  >
                    <Icon name="x-circle" className="h-5 w-5 shrink-0 text-neutral-600" />
                    <BodyText as="span" size="sm">
                      Not interested
                    </BodyText>
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    className={ACTION_ROW_CLASS}
                    onClick={handleReport}
                    label="Report"
                  >
                    <Icon name="flag" className="h-5 w-5 shrink-0 text-neutral-600" />
                    <BodyText as="span" size="sm">
                      Report
                    </BodyText>
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    className={ACTION_ROW_CLASS}
                    onClick={handleCopyLink}
                    label="Copy link"
                  >
                    <Icon name="copy" className="h-5 w-5 shrink-0 text-neutral-600" />
                    <BodyText as="span" size="sm">
                      Copy link
                    </BodyText>
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    className={ACTION_ROW_CLASS}
                    onClick={handleSave}
                    label={isSaved ? "Unsave" : "Save"}
                  >
                    <Icon
                      name="bookmark"
                      className={`h-5 w-5 shrink-0 ${isSaved ? "fill-neutral-700 text-neutral-700" : "text-neutral-600"}`}
                    />
                    <BodyText as="span" size="sm">
                      {isSaved ? "Unsave" : "Save"}
                    </BodyText>
                  </Button>
                </div>
              </div>
            </AccessibleDialog.Panel>
          </Transition.Child>
        </div>
      </AccessibleDialog>
    </Transition>
  );
}
