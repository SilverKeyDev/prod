import { Calendar } from "lucide-react";

import { BodyText, Button, Title } from "packages/ui/components/index.web";

import Card from "@/components/layout/Card.web";

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
        <Title
          as="h3"
          size="lg"
          className="mb-2 font-semibold text-gray-900 sm:text-xl md:text-2xl"
        >
          Connect Your Google Calendar
        </Title>
        <BodyText as="p" size="sm" className="mb-6 max-w-md text-gray-600 sm:text-base">
          Sync your Google Calendar to view your upcoming events and appointments directly on your
          dashboard.
        </BodyText>
        <Button
          variant="primary"
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
