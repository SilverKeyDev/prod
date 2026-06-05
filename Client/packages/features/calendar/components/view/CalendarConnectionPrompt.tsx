import { Icon } from "packages/ui/components/structure/primitives";
import { Box, Pressable, Text } from "packages/ui/components/structure/primitives";

type CalendarConnectionPromptProps = {
  onConnect: () => void;
  isLoading?: boolean;
};

export function CalendarConnectionPrompt({
  onConnect,
  isLoading = false,
}: CalendarConnectionPromptProps) {
  return (
    <Box className="border-border bg-background-base w-full rounded-xl border p-6">
      <Box className="flex flex-col items-center justify-center text-center sm:py-2">
        <Icon name="calendar" className="text-primary mb-4 h-12 w-12 sm:h-16 sm:w-16" />
        <Text className="text-text-primary mb-2 text-base font-semibold sm:text-lg">
          Connect Your Google Calendar
        </Text>
        <Text className="text-text-secondary mb-6 max-w-md text-sm">
          Sync your Google Calendar to view your upcoming events and appointments directly on your
          dashboard.
        </Text>
        <Pressable
          onPress={onConnect}
          disabled={isLoading}
          className="bg-primary inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-75"
        >
          <Icon name="calendar" className="mr-2 h-4 w-4" />
          <Text className="text-sm font-semibold text-white">
            {isLoading ? "Connecting…" : "Connect Google Calendar"}
          </Text>
        </Pressable>
      </Box>
    </Box>
  );
}
