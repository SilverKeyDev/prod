import { Calendar } from "lucide-react";
import { Button } from "../../../../components/ui";
import Card from "../../../../components/layout/Card";

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
        <Calendar className="mb-4 h-12 w-12 text-olive/60 sm:h-16 sm:w-16" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900 sm:text-xl md:text-2xl">
          Connect Your Google Calendar
        </h3>
        <p className="mb-6 max-w-md text-sm text-gray-600 sm:text-base">
          Sync your Google Calendar to view your upcoming events and appointments
          directly on your dashboard.
        </p>
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

