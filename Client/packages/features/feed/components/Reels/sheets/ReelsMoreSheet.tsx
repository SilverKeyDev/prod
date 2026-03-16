import { Icon } from "@ui/icons";

import { Transition } from "packages/ui/components/adapters/headless";
import { Box } from "packages/ui/components/primitives";

import { AccessibleDialog, BodyText, Button, CloseButton, Title } from "@/components/ui";
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
  "flex flex-row w-full items-center gap-3 px-4 py-3 text-left border-0 rounded-none bg-transparent hover:bg-neutral-50 active:bg-neutral-100 active:opacity-90 text-neutral-900";
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
    <Transition show={isOpen} as={Box}>
      <AccessibleDialog onClose={onClose} className="relative z-50" label="More options">
        {}
        <Transition.Child
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Box className="fixed inset-0 bg-neutral-900" aria-hidden onClick={onClose} />
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
              className="pointer-events-auto flex min-h-0 w-full flex-[0.75] flex-row flex-col rounded-t-2xl bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header — same pattern as Comments: drag handle + title + close */}
              <Box className="flex shrink-0 flex-row flex-col items-center border-b border-neutral-200 pt-2">
                <Box className="mb-2 h-1 w-10 rounded-full bg-neutral-300" aria-hidden />
                <Box className="flex w-full flex-row items-center justify-between gap-2 px-4 pb-3">
                  <Box className="w-9 shrink-0" aria-hidden />
                  <Title size="sm" as="h2" className="flex-1 text-center">
                    More
                  </Title>
                  <Box className="flex w-9 shrink-0 flex-row justify-end">
                    <CloseButton onClick={onClose} size="sm" label="Close more options" />
                  </Box>
                </Box>
              </Box>

              {/* Action list */}
              <Box className="min-h-0 flex-1 overflow-y-auto">
                <Box className="py-2">
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
                      // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
                      className={`h-5 w-5 shrink-0 ${isSaved ? "fill-neutral-700 text-neutral-700" : "text-neutral-600"}`}
                    />
                    <BodyText as="span" size="sm">
                      {isSaved ? "Unsave" : "Save"}
                    </BodyText>
                  </Button>
                </Box>
              </Box>
            </AccessibleDialog.Panel>
          </Transition.Child>
          {}
        </Box>
      </AccessibleDialog>
    </Transition>
  );
}
