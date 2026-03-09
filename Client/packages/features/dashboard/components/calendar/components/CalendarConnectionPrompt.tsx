import { BodyText, Button, Title } from "@ui";
import { Icon } from "@ui/icons";
import { Card } from "@ui/layout";

type CalendarConnectionPromptProps = {
  onConnect: () => void;
  isLoading?: boolean;
};

export function CalendarConnectionPrompt({
  onConnect,
  isLoading = false,
}: CalendarConnectionPromptProps) {
  return (
    <Card padding="lg" className="w-full">
      <div className="flex flex-col items-center justify-center py-8 text-center sm:py-12">
        <Icon name="calendar" className="text-olive/60 mb-4 h-12 w-12 sm:h-16 sm:w-16" />
        <Title as="h3" size="lg" className="mb-2 text-gray-900 sm:text-xl md:text-2xl">
          Connect Your Google Calendar
        </Title>
        <BodyText as="p" size="sm" muted className="mb-6 max-w-md sm:text-base">
          Sync your Google Calendar to view your upcoming events and appointments directly on your
          dashboard.
        </BodyText>
        <Button
          variant="primary"
          size="md"
          onClick={onConnect}
          loading={isLoading}
          icon={<Icon name="calendar" className="h-4 w-4" />}
          iconPosition="left"
        >
          Connect Google Calendar
        </Button>
      </div>
    </Card>
  );
}
