import React from "react";

import { Icon } from "@ui/icons";

import type { ClientTimelineEvent } from "packages/schemas/agent";
import SectionCard from "packages/ui/components/cards/SectionCard";
import { Box } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import { BodyText, Title } from "@/components/ui";
type ClientTimelineProps = {
  events: ClientTimelineEvent[];
};
const ClientTimeline: React.FC<ClientTimelineProps> = ({ events }) => {
  const sortedEvents = [...events].sort(
    (a, b) => dateParseISO(a.date).valueOf() - dateParseISO(b.date).valueOf()
  );
  const getEventIcon = (type: ClientTimelineEvent["type"]) => {
    switch (type) {
      case "offer":
        return <Icon name="file-text" className="text-navy h-5 w-5" />;
      case "inspection":
        return <Icon name="alert-circle" className="text-gold h-5 w-5" />;
      case "closing":
        return <Icon name="check-circle" className="text-olive h-5 w-5" />;
      default:
        return <Icon name="calendar" className="text-gold h-5 w-5" />;
    }
  };
  const formatDate = (dateString: string) => {
    const date = dateParseISO(dateString).toDate();
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  return (
    <SectionCard title="Client Timeline" iconName="calendar">
      <Box className="flex flex-col space-y-4">
        {sortedEvents.length === 0 ? (
          <Box className="flex py-8 text-center">
            <BodyText as="p" size="sm" className="text-black/60">
              No timeline events
            </BodyText>
          </Box>
        ) : (
          <Box className="relative">
            {/* Timeline line */}
            <Box className="bg-beige/30 absolute bottom-0 left-6 top-0 w-0.5"></Box>

            {/* Timeline events */}
            <Box className="flex flex-col space-y-6">
              {sortedEvents.map((event) => (
                <Box key={event.id} className="relative flex items-start gap-4">
                  {/* Icon */}
                  <Box className="border-beige/50 z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 bg-white">
                    {getEventIcon(event.type)}
                  </Box>

                  {/* Content */}
                  <Box className="min-w-0 flex-1 pt-1">
                    <Box className="mb-1 flex items-center justify-between gap-2">
                      <Title as="h4" size="md" className="text-navy font-semibold">
                        {event.title}
                      </Title>
                      <BodyText as="span" size="sm" className="whitespace-nowrap text-black/60">
                        {formatDate(event.date)}
                      </BodyText>
                    </Box>
                    {event.description && (
                      <BodyText as="p" size="sm" className="text-black/60">
                        {event.description}
                      </BodyText>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </SectionCard>
  );
};
export default ClientTimeline;
