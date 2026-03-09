import React, { useMemo } from "react";

import { Icon } from "@ui/icons";

import type { UrgentAlert } from "packages/types";
import { dateNow, dateParseISO } from "packages/utils/date";

import Card from "@/components/layout/Card.web";
import { BodyText, Button, Title } from "@/components/ui";
type UrgentAlertsProps = {
  alerts: UrgentAlert[];
  onDismiss: (id: string) => void;
  onNavigateToClient?: (clientId: string) => void;
};
const UrgentAlerts: React.FC<UrgentAlertsProps> = ({ alerts, onDismiss, onNavigateToClient }) => {
  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      const severityOrder: Record<string, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [alerts]);
  const severityColors: Record<
    string,
    {
      bg: string;
      border: string;
      text: string;
    }
  > = {
    critical: {
      bg: "bg-rose-50",
      border: "border-rose-300",
      text: "text-rose-800",
    },
    high: {
      bg: "bg-olive/10",
      border: "border-olive/30",
      text: "text-olive",
    },
    medium: {
      bg: "bg-gold/10",
      border: "border-gold/30",
      text: "text-gold",
    },
    low: {
      bg: "bg-neutral-100",
      border: "border-neutral-300",
      text: "text-navy",
    },
  };
  const formatTimeRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const now = dateNow();
    const deadlineDate = dateParseISO(deadline);
    const diff = deadlineDate.valueOf() - now.valueOf();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return "Due now";
  };
  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center gap-2">
        <Icon name="alert-triangle" className="h-5 w-5 text-rose-600 sm:h-6 sm:w-6" />
        <Title as="h2" size="sm" className="text-navy">
          Urgent Alerts
        </Title>
      </div>

      <div className="max-h-96 space-y-3 overflow-y-auto">
        {sortedAlerts.length === 0 ? (
          <div className="py-8 text-center">
            <BodyText as="p" size="sm" className="text-black/60">
              No urgent alerts
            </BodyText>
          </div>
        ) : (
          sortedAlerts.map((alert) => {
            const colors = severityColors[alert.severity] || severityColors.medium;
            return (
              <div
                key={alert.id}
                className={`rounded-lg border-2 p-3 sm:p-4 ${colors.border} ${colors.bg} ${colors.text} transition-all hover:shadow-md`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <BodyText as="p" size="sm" className="mb-1 font-medium">
                      {alert.message}
                    </BodyText>
                    {alert.deadline && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <Icon name="clock" className="h-3 w-3 sm:h-4 sm:w-4" />
                        <BodyText as="span" size="sm" className="font-medium">
                          {formatTimeRemaining(alert.deadline)}
                        </BodyText>
                      </div>
                    )}
                    {alert.client_id && onNavigateToClient && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNavigateToClient(alert.client_id!)}
                        className="mt-2 h-auto py-0 text-xs underline hover:no-underline sm:text-sm"
                      >
                        View client →
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDismiss(alert.id)}
                    className="h-auto min-w-0 flex-shrink-0 p-1 hover:bg-black/10"
                    label="Dismiss alert"
                  >
                    <Icon name="x" className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
export default UrgentAlerts;
