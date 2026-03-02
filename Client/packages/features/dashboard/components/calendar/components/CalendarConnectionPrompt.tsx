import { BodyText, Button, Title } from "@ui";
import { Card } from "@ui/layout";
import { Calendar } from "lucide-react";

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
        <Calendar className="text-olive/60 mb-4 h-12 w-12 sm:h-16 sm:w-16" />
        <Title as="h3" size="md" className="mb-2 text-gray-900">
          Connect Your Google Calendar
        </Title>
        <BodyText as="p" size="sm" className="mb-6 max-w-md text-gray-600">
          Sync your Google Calendar to view your upcoming events and appointments directly on your
          dashboard.
        </BodyText>
        <Button
          variant="olive"
          size="md"
          onClick={onConnect}
          loading={isLoading}
          icon={<Calendar className="h-4 w-4" />}
          iconPosition="left"
        >
          Connect Google Calendar
        </Button>
      </div>
    </Card>
  );
}
