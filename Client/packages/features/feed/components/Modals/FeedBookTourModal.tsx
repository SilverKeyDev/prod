import { Box } from "packages/ui/components/structure/primitives";
import { Transition } from "packages/ui/components/system/adapters/headless";

import { AccessibleDialog, BodyText, Button, CloseButton, Title } from "@/components/ui";
import type { FeedListing } from "@/features/feed/types/feed";
import { logTourClick } from "@/features/feed/utils";

type FeedBookTourModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: FeedListing;
};

/**
 * Modal for booking a property tour from the feed.
 * Keeps user in flow without navigating away.
 */
export function FeedBookTourModal({ isOpen, onClose, item }: FeedBookTourModalProps) {
  return (
    <Transition show={isOpen} as="div">
      <AccessibleDialog onClose={onClose} className="z-modal relative" label="Book Tour">
        <Transition.Child
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Box className="fixed inset-0 bg-black/50" aria-hidden onClick={onClose} />
        </Transition.Child>
        <Box className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <AccessibleDialog.Panel className="bg-background-surface w-full max-w-sm rounded-2xl p-6 shadow-xl">
              <Box className="flex items-start justify-between gap-4">
                <Title size="md" as="h2">
                  Book a Tour
                </Title>
                <CloseButton onClick={onClose} size="sm" />
              </Box>
              <BodyText size="sm" className="mt-3" muted>
                Schedule a viewing for {item.user.name || "this property"}. A SilverKey agent will
                reach out to confirm your tour.
              </BodyText>
              <Box className="mt-4 flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    logTourClick(item.id);
                    onClose();
                  }}
                  className="w-full"
                  iconName="calendar"
                >
                  Request Tour
                </Button>
                <Button variant="outline" size="md" onClick={onClose} iconName="x">
                  Cancel
                </Button>
              </Box>
            </AccessibleDialog.Panel>
          </Transition.Child>
        </Box>
      </AccessibleDialog>
    </Transition>
  );
}
