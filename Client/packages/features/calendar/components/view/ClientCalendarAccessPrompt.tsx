import { useLocalization } from "packages/contexts";
import { Icon } from "packages/ui/components/primitives";
import { Box, Text } from "packages/ui/components/primitives";

type ClientCalendarAccessPromptProps = {
  clientHasConnection: boolean;
};

export function ClientCalendarAccessPrompt({
  clientHasConnection,
}: ClientCalendarAccessPromptProps) {
  const { t } = useLocalization();

  const titleKey = clientHasConnection
    ? "dashboard.client_calendar_permission_title"
    : "dashboard.client_calendar_not_connected_title";
  const bodyKey = clientHasConnection
    ? "dashboard.client_calendar_permission_body"
    : "dashboard.client_calendar_not_connected_body";

  return (
    <Box className="border-border bg-background-base w-full rounded-xl border p-6">
      <Box className="flex flex-col items-center justify-center text-center sm:py-2">
        <Icon name="calendar" className="text-primary mb-4 h-12 w-12 sm:h-16 sm:w-16" />
        <Text className="text-text-primary mb-2 text-base font-semibold sm:text-lg">
          {t(titleKey)}
        </Text>
        <Text className="text-text-secondary max-w-md text-sm">{t(bodyKey)}</Text>
      </Box>
    </Box>
  );
}
