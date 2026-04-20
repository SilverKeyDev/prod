import { Icon } from "@ui/icons";

import { Box } from "packages/ui/components/primitives";

import BaseModal from "@/components/modals/BaseModal";
import { Title } from "@/components/ui";
import type { UseCalendarEventRequestFormParams } from "@/features/agent/hooks/data/useCalendarEventRequestForm";

import { CalendarEventRequestFormCore } from "./CalendarEventRequestFormCore.web";

export type CalendarEventRequestModalProps = UseCalendarEventRequestFormParams & {
  isOpen: boolean;
};

export default function CalendarEventRequestModal({
  isOpen,
  onClose,
  onSuccess,
  sendCalendarEventMessage,
}: CalendarEventRequestModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      headerContent={
        <Box className="flex items-center gap-2">
          <Icon name="calendar" className="text-text-primary h-5 w-5 flex-shrink-0" />
          <Title as="h3" size="lg" className="text-text-primary truncate font-medium sm:text-lg">
            Request Calendar Event
          </Title>
        </Box>
      }
      size="md"
    >
      <CalendarEventRequestFormCore
        onClose={onClose}
        onSuccess={onSuccess}
        sendCalendarEventMessage={sendCalendarEventMessage}
      />
    </BaseModal>
  );
}
