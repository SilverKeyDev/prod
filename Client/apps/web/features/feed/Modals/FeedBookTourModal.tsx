import { Transition } from "@headlessui/react";

import type { FeedListing } from "packages/schemas/content/feed/feed";
import { logTourClick } from "packages/utils/domain/feed";

import {
  AccessibleDialog,
  BodyText,
  Button,
  CloseButton,
  Title,
} from "@/components/ui/index.web";

type FeedBookTourModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: FeedListing;
};

/**
 * Modal for booking a property tour from the feed.
 * Keeps user in flow without navigating away.
 */
export function FeedBookTourModal({
  isOpen,
  onClose,
  item,
}: FeedBookTourModalProps) {
  return (
    <Transition show={isOpen} as="div">
      <AccessibleDialog
        onClose={onClose}
        className="relative z-50"
        label="Book Tour"
      >
        <Transition.Child
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black/50"
            aria-hidden
            onClick={onClose}
          />
        </Transition.Child>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <AccessibleDialog.Panel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <Title size="md" as="h2">
                  Book a Tour
                </Title>
                <CloseButton onClick={onClose} size="sm" />
              </div>
              <BodyText size="sm" className="mt-3" muted>
                Schedule a viewing for {item.user.name || "this property"}. A
                SilverKey agent will reach out to confirm your tour.
              </BodyText>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    logTourClick(item.id);
                    onClose();
                  }}
                  className="w-full"
                >
                  Request Tour
                </Button>
                <Button variant="outline" size="md" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </AccessibleDialog.Panel>
          </Transition.Child>
        </div>
      </AccessibleDialog>
    </Transition>
  );
}
