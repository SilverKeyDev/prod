import { BodyText, Title } from "@ui";
import { Icon } from "@ui/icons";

import { Box, Pressable, Text } from "packages/ui/components/primitives";

type CalendarConnectionPromptProps = {
  onConnect: () => void;
  isLoading?: boolean;
};

export function CalendarConnectionPrompt({
  onConnect,
  isLoading = false,
}: CalendarConnectionPromptProps) {
  return (
    <Box className="w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <Box className="flex flex-col items-center justify-center py-8 text-center sm:py-12">
        <Icon name="calendar" className="text-olive/60 mb-4 h-12 w-12 sm:h-16 sm:w-16" />
        <Title as="h3" size="lg" className="mb-2 text-gray-900 sm:text-xl md:text-2xl">
          Connect Your Google Calendar
        </Title>
        <BodyText as="p" size="sm" muted className="mb-6 max-w-md sm:text-base">
          Sync your Google Calendar to view your upcoming events and appointments directly on your
          dashboard.
        </BodyText>
        <Pressable
          onPress={onConnect}
          disabled={isLoading}
          className="flex flex-row items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-2 hover:bg-brand-accent/90 disabled:opacity-50"
        >
          {!isLoading && <Icon name="calendar" className="h-4 w-4 text-white" />}
          {isLoading && <Icon name="loader-2" className="h-4 w-4 animate-spin text-white" />}
          <Text className="font-medium text-white">
            {isLoading ? "Connecting..." : "Connect Google Calendar"}
          </Text>
        </Pressable>
      </Box>
    </Box>
  );
}
