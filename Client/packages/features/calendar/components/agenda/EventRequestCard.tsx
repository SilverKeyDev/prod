import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { EventRequestPayload } from "packages/features/messaging/utils/eventRequestPayload";
import Button from "packages/ui/components/actions/button/Button";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import { formatEventRequestRangeSummaryEnUs } from "packages/utils/core/date";
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
  const isAccepting = isAcceptingProp || (messageId != null && messageId === acceptingMessageId);
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
  const dateTimeStr = formatEventRequestRangeSummaryEnUs(payload.start, payload.end);
  if (status === "cancelled") {
    return (
      <Box className="border-border bg-background-surface w-full min-w-0 rounded-lg border p-4 shadow-sm">
        <Box className="flex items-start gap-3">
          <Box className="bg-accent-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
            <Icon name="calendar" className="text-text-secondary h-5 w-5" />
          </Box>
          <Box className="min-w-0 flex-1">
            <Title size="sm" as="h4" className="mb-1">
              {payload.title}
            </Title>
            <BodyText size="sm" muted className="mb-2">
              {dateTimeStr}
            </BodyText>
            {payload.location?.trim() && (
              <BodyText size="sm" muted className="mb-2">
                {payload.location.trim()}
              </BodyText>
            )}
            {payload.description?.trim() && (
              <BodyText size="sm" muted className="mb-3 whitespace-pre-line">
                {payload.description.trim()}
              </BodyText>
            )}
            <Box className="text-text-secondary flex items-center gap-2 text-sm font-medium">
              <Icon name="x" className="h-4 w-4 flex-shrink-0" />
              Event request cancelled
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }
  if (status === "accepted") {
    return (
      <Box className="border-border bg-background-surface w-full min-w-0 rounded-lg border p-4 shadow-sm">
        <Box className="flex items-start gap-3">
          <Box className="bg-accent-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
            <Icon name="calendar" className="text-text-secondary h-5 w-5" />
          </Box>
          <Box className="min-w-0 flex-1">
            <Title size="sm" as="h4" className="mb-1">
              {payload.title}
            </Title>
            <BodyText size="sm" muted className="mb-2">
              {dateTimeStr}
            </BodyText>
            {payload.location?.trim() && (
              <BodyText size="sm" muted className="mb-2">
                {payload.location.trim()}
              </BodyText>
            )}
            {payload.description?.trim() && (
              <BodyText size="sm" muted className="mb-3 whitespace-pre-line">
                {payload.description.trim()}
              </BodyText>
            )}
            <Box className="text-primary flex items-center gap-2 text-sm font-medium">
              <Icon name="check" className="h-4 w-4 flex-shrink-0" />
              {t("agent.added_to_calendar")}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }
  // status === "pending"
  const showAccept = !isFromCurrentUser;
  const showCancel = true;
  return (
    <Box className="border-border bg-background-surface w-full min-w-0 rounded-lg border p-4 shadow-sm">
      <Box className="flex items-start gap-3">
        <Box className="bg-accent-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
          <Icon name="calendar" className="text-text-secondary h-5 w-5" />
        </Box>
        <Box className="min-w-0 flex-1">
          <Title size="sm" as="h4" className="mb-1">
            {payload.title}
          </Title>
          <BodyText size="sm" muted className="mb-2">
            {dateTimeStr}
          </BodyText>
          {payload.location?.trim() && (
            <BodyText size="sm" muted className="mb-2">
              {payload.location.trim()}
            </BodyText>
          )}
          {payload.description?.trim() && (
            <BodyText size="sm" muted className="mb-3 whitespace-pre-line">
              {payload.description.trim()}
            </BodyText>
          )}
          <Box className="flex flex-wrap items-center gap-2">
            {showAccept && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAccept}
                disabled={loading}
                loading={isAccepting || isSubmitting}
                icon={<Icon name="check" className="h-4 w-4" />}
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
                icon={<Icon name="x" className="h-4 w-4" />}
              >
                {t("common.cancel")}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
