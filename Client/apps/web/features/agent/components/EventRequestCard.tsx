import React from "react";

import { Calendar, Check, X } from "lucide-react";

import { useLocalization } from "packages/contexts";
import { dateParseISO } from "packages/utils/core/date";
import type { EventRequestPayload } from "packages/utils/domain/messaging/eventRequestPayload";

import Button from "@/components/ui/button/Button";
import BodyText from "@/components/ui/text/BodyText";
import Title from "@/components/ui/text/Title";

export type EventRequestStatus = "pending" | "accepted" | "cancelled";

type EventRequestCardProps = {
  payload: EventRequestPayload;
  onAccept: () => Promise<void>;
  onCancel: () => Promise<void>;
  isFromCurrentUser: boolean;
  status: EventRequestStatus;
  isAccepting?: boolean;
  messageId?: string;
  acceptingMessageId?: string | null;
};

function formatEventDateTime(start: string, end: string): string {
  const startDate = dateParseISO(start).toDate();
  const endDate = dateParseISO(end).toDate();
  const dateStr = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = `${startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })} – ${endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;
  return `${dateStr} at ${timeStr}`;
}

export default function EventRequestCard({
  payload,
  onAccept,
  onCancel,
  isFromCurrentUser,
  status,
  isAccepting: isAcceptingProp = false,
  messageId,
  acceptingMessageId,
}: EventRequestCardProps) {
  const { t } = useLocalization();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [cancelSubmitting, setCancelSubmitting] = React.useState(false);
  const isAccepting =
    isAcceptingProp || (messageId != null && messageId === acceptingMessageId);
  const loading = isAccepting || isSubmitting || cancelSubmitting;

  const handleAccept = React.useCallback(async () => {
    if (status !== "pending" || loading) return;
    setIsSubmitting(true);
    try {
      await onAccept();
    } finally {
      setIsSubmitting(false);
    }
  }, [status, loading, onAccept]);

  const handleCancel = React.useCallback(async () => {
    if (status !== "pending" && status !== "accepted") return;
    if (loading) return;
    setCancelSubmitting(true);
    try {
      await onCancel();
    } finally {
      setCancelSubmitting(false);
    }
  }, [status, loading, onCancel]);

  const dateTimeStr = formatEventDateTime(payload.start, payload.end);

  if (status === "cancelled") {
    return (
      <div className="w-full min-w-0 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-beige/50">
            <Calendar className="h-5 w-5 text-black/70" />
          </div>
          <div className="min-w-0 flex-1">
            <Title size="sm" as="h4" className="mb-1">
              {payload.title}
            </Title>
            <BodyText size="sm" muted className="mb-2">
              {dateTimeStr}
            </BodyText>
            {payload.description?.trim() && (
              <BodyText size="sm" muted className="mb-3 whitespace-pre-line">
                {payload.description.trim()}
              </BodyText>
            )}
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
              <X className="h-4 w-4 flex-shrink-0" />
              Event request cancelled
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "accepted") {
    return (
      <div className="w-full min-w-0 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-beige/50">
            <Calendar className="h-5 w-5 text-black/70" />
          </div>
          <div className="min-w-0 flex-1">
            <Title size="sm" as="h4" className="mb-1">
              {payload.title}
            </Title>
            <BodyText size="sm" muted className="mb-2">
              {dateTimeStr}
            </BodyText>
            {payload.description?.trim() && (
              <BodyText size="sm" muted className="mb-3 whitespace-pre-line">
                {payload.description.trim()}
              </BodyText>
            )}
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <Check className="h-4 w-4 flex-shrink-0" />
              {t("agent.added_to_calendar")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // status === "pending"
  const showAccept = !isFromCurrentUser;
  const showCancel = true;

  return (
    <div className="w-full min-w-0 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-beige/50">
          <Calendar className="h-5 w-5 text-black/70" />
        </div>
        <div className="min-w-0 flex-1">
          <Title size="sm" as="h4" className="mb-1">
            {payload.title}
          </Title>
          <BodyText size="sm" muted className="mb-2">
            {dateTimeStr}
          </BodyText>
          {payload.description?.trim() && (
            <BodyText size="sm" muted className="mb-3 whitespace-pre-line">
              {payload.description.trim()}
            </BodyText>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {showAccept && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAccept}
                disabled={loading}
                loading={isAccepting || isSubmitting}
                icon={<Check className="h-4 w-4" />}
              >
                {t("agent.accept")}
              </Button>
            )}
            {showCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={loading}
                loading={cancelSubmitting}
                icon={<X className="h-4 w-4" />}
              >
                {t("common.cancel")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
