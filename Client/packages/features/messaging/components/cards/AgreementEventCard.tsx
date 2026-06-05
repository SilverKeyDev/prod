/**
 * Renders styled inline cards for DocuSign agreement lifecycle events
 * within the messaging thread (parsed from __AGREEMENT_EVENT__ messages).
 */

import Button from "@ui/button/Button";
import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import {
  AGREEMENT_EVENT_HEADLINES,
  type AgreementEventPayload,
} from "packages/features/messaging/utils/agreementEventPayload";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText } from "@/components/ui";

const EVENT_CONFIG: Record<
  AgreementEventPayload["event"],
  {
    iconName: string;
    iconColor: string;
    headline: string;
  }
> = {
  sent: {
    iconName: "send",
    iconColor: "text-primary",
    headline: AGREEMENT_EVENT_HEADLINES.sent,
  },
  client_signed: {
    iconName: "file-signature",
    iconColor: "text-yellow-800",
    headline: AGREEMENT_EVENT_HEADLINES.client_signed,
  },
  agent_signed: {
    iconName: "file-signature",
    iconColor: "text-primary",
    headline: AGREEMENT_EVENT_HEADLINES.agent_signed,
  },
  completed: {
    iconName: "check",
    iconColor: "text-green-700",
    headline: AGREEMENT_EVENT_HEADLINES.completed,
  },
};

type AgreementEventCardProps = {
  payload: AgreementEventPayload;
  /** When true, the agreement row is gone from the viewer's document library (e.g. deleted). */
  isRemovedFromLibrary?: boolean;
  onSignNow?: (agreementId: string) => void;
  /**
   * Same contract as document cards: opens the standard PDF / agreement viewer.
   */
  onViewDocument?: (agreementId: string, documentName: string) => void;
  isAgent?: boolean;
  /** Current user id (for sequential signing: hide Sign when it is not their turn). */
  viewerUserId?: string | null;
};

export default function AgreementEventCard({
  payload,
  isRemovedFromLibrary = false,
  onSignNow,
  onViewDocument,
  isAgent = false,
  viewerUserId = null,
}: AgreementEventCardProps) {
  const { t } = useLocalization();

  if (isRemovedFromLibrary) {
    return (
      <Box className="border-border bg-background-surface rounded-lg border border-dashed p-3 opacity-95">
        <Box className="flex items-start gap-2.5">
          <Box className="border-border bg-background-base mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border">
            <Icon name="trash-2" size={14} className="text-text-secondary" />
          </Box>
          <Box className="min-w-0 flex-1">
            <BodyText size="sm" className="text-text-primary font-semibold">
              {t("agent.messaging_agreement_deleted_title")}
            </BodyText>
            <BodyText size="xs" muted className="mt-0.5">
              {payload.title}
            </BodyText>
            <BodyText size="xs" muted className="mt-1.5">
              {t("agent.messaging_agreement_deleted_body")}
            </BodyText>
          </Box>
        </Box>
      </Box>
    );
  }

  const config = EVENT_CONFIG[payload.event] ?? EVENT_CONFIG.sent;

  const sentForClient = payload.event === "sent" && !isAgent;
  const signTurnMatchesViewer =
    !payload.next_signer_user_id || !viewerUserId || payload.next_signer_user_id === viewerUserId;

  const showSignNow =
    (payload.event === "client_signed" && isAgent) || (sentForClient && signTurnMatchesViewer);

  const showViewWhileEnvelopeOut =
    sentForClient && !signTurnMatchesViewer && Boolean(onViewDocument);

  const showViewSigned = payload.event === "completed";

  return (
    <Box className="border-border bg-accent-muted rounded-lg border p-3">
      <Box className="flex items-start gap-2.5">
        <Box className="border-border bg-background-surface mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border">
          <Icon name={config.iconName} size={14} className={config.iconColor} />
        </Box>
        <Box className="min-w-0 flex-1">
          <BodyText size="sm" className="text-text-primary font-semibold">
            {config.headline}
          </BodyText>
          <BodyText size="xs" muted className="mt-0.5">
            {payload.title}
          </BodyText>

          {showViewWhileEnvelopeOut && onViewDocument ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onViewDocument(payload.agreement_id, payload.title)}
              icon={<Icon name="eye" size={16} />}
              fullWidth
              className="mt-2 justify-center"
            />
          ) : null}

          {showViewSigned && onViewDocument ? (
            <Button
              variant="success"
              size="sm"
              onClick={() => onViewDocument(payload.agreement_id, payload.title)}
              icon={<Icon name="check-circle" size={16} />}
              fullWidth
              className="mt-2 justify-center"
            />
          ) : null}

          {showSignNow && onSignNow ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onSignNow(payload.agreement_id)}
              icon={<Icon name="file-signature" size={16} />}
              fullWidth
              className="mt-2 justify-center"
            >
              Sign now
            </Button>
          ) : null}

          {payload.event === "client_signed" && !isAgent && (
            <Box className="mt-1.5 flex items-center gap-1">
              <Icon name="clock" size={12} className="text-text-secondary" />
              <BodyText size="xs" muted>
                Waiting for agent review
              </BodyText>
            </Box>
          )}

          {payload.event === "sent" && isAgent && (
            <Box className="mt-1.5 flex items-center gap-1">
              <Icon name="clock" size={12} className="text-text-secondary" />
              <BodyText size="xs" muted>
                Waiting for client signature
              </BodyText>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
