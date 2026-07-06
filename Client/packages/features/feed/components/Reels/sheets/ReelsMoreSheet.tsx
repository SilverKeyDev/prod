import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/structure/primitives";
import { Transition } from "packages/ui/components/system/adapters/headless";

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
  "flex flex-row w-full items-center gap-3 px-4 py-3 text-left border-0 rounded-none bg-transparent hover:bg-background-base active:bg-neutral-200 active:opacity-90 text-text-primary";
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
  const { t } = useLocalization();
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
      <AccessibleDialog onClose={onClose} className="z-modal relative" label="More options">
        {}
        <Transition.Child
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Box className="bg-overlay-backdrop fixed inset-0" aria-hidden onClick={onClose} />
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
              className="bg-background-surface pointer-events-auto flex min-h-0 w-full flex-[0.75] flex-col rounded-t-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - same pattern as Comments: drag handle + title + close */}
              <Box className="border-border flex shrink-0 flex-col items-center border-b pt-2">
                <Box className="bg-border mb-2 h-1 w-10 rounded-full" aria-hidden />
                <Box className="flex w-full flex-row items-center justify-between gap-2 px-4 pb-3">
                  <Box className="w-9 shrink-0" aria-hidden />
                  <Title size="sm" as="h2" className="flex-1 text-center">
                    {t("feed.more")}
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
                    <Icon name="x-circle" className="text-text-secondary h-5 w-5 shrink-0" />
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
                    <Icon name="flag" className="text-text-secondary h-5 w-5 shrink-0" />
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
                    iconName="copy"
                    contentAlign="start"
                  >
                    <BodyText as="span" size="sm">
                      Copy link
                    </BodyText>
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    className={ACTION_ROW_CLASS}
                    onClick={handleSave}
                    label={isSaved ? t("feed.remove_saved") : t("feed.save")}
                    iconName="bookmark"
                    contentAlign="start"
                  >
                    <BodyText as="span" size="sm">
                      {isSaved ? t("feed.remove_saved") : t("feed.save")}
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
