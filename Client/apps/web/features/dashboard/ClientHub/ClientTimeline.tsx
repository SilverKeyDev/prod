import React from "react";
import { Calendar, FileText, CheckCircle, AlertCircle } from "lucide-react";
import SectionCard from "../../../components/layout/SectionCard";
import type { ClientTimelineEvent } from "../../../../../packages/schemas/agent";

type ClientTimelineProps = {
  events: ClientTimelineEvent[];
};

const ClientTimeline: React.FC<ClientTimelineProps> = ({ events }) => {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const getEventIcon = (type: ClientTimelineEvent["type"]) => {
    switch (type) {
      case "offer":
        return <FileText className="h-5 w-5 text-navy" />;
      case "inspection":
        return <AlertCircle className="h-5 w-5 text-gold" />;
      case "closing":
        return <CheckCircle className="h-5 w-5 text-olive" />;
      default:
        return <Calendar className="h-5 w-5 text-gold" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <SectionCard title="Client Timeline" icon={Calendar}>
      <div className="space-y-4">
        {sortedEvents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-responsive-sm text-black/60">
              No timeline events
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-beige/30"></div>

            {/* Timeline events */}
            <div className="space-y-6">
              {sortedEvents.map((event, index) => (
                <div key={event.id} className="relative flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-beige/50 flex items-center justify-center z-10">
                    {getEventIcon(event.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-responsive-base font-semibold text-navy">
                        {event.title}
                      </h4>
                      <span className="text-responsive-sm text-black/60 whitespace-nowrap">
                        {formatDate(event.date)}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-responsive-sm text-black/60">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default ClientTimeline;
