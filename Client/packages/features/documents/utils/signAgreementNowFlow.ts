import { docusignApi } from "packages/features/documents/api/docusign";
import { log, LOG_CATEGORIES } from "packages/logger";
import { getWindow } from "packages/utils/platform";

export type SignAgreementNowFlowUser = {
  id?: string;
  email?: string | null;
  is_agent?: boolean;
} | null;

export async function runSignAgreementNowFlow(
  agreementId: string,
  user: SignAgreementNowFlowUser,
): Promise<void> {
  const fetchAgreement = async () => {
    const agreementResponse = await docusignApi.getAgreement(agreementId);
    const agreement = agreementResponse.agreement;
    if (!agreementResponse.success || !agreement) {
      throw new Error(agreementResponse.error ?? "Failed to fetch agreement");
    }
    return agreement;
  };

  const waitForEnvelope = async (maxAttempts = 15, initialDelayMs = 500) => {
    log.debug(
      LOG_CATEGORIES.DOCUSIGN,
      "Waiting for DocuSign envelope to be created",
      {
        agreementId,
        maxAttempts,
        initialDelayMs,
      },
    );

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const agreement = await fetchAgreement();
      if (agreement.docusign_envelope_id) {
        log.debug(
          LOG_CATEGORIES.DOCUSIGN,
          "DocuSign envelope created successfully",
          {
            agreementId,
            envelopeId: agreement.docusign_envelope_id,
            attemptNumber: attempt + 1,
          },
        );
        return agreement;
      }

      if (attempt < maxAttempts - 1) {
        const delay = Math.min(initialDelayMs * Math.pow(1.5, attempt), 2000);
        log.debug(
          LOG_CATEGORIES.DOCUSIGN,
          "Envelope not ready yet, waiting...",
          {
            agreementId,
            attemptNumber: attempt + 1,
            nextDelayMs: delay,
          },
        );
        await new Promise<void>((resolve) => {
          setTimeout(resolve, delay);
        });
      }
    }

    log.warn(
      LOG_CATEGORIES.DOCUSIGN,
      "Envelope creation timeout after max attempts",
      {
        agreementId,
        maxAttempts,
        totalWaitTime: "~20 seconds",
      },
    );
    return fetchAgreement();
  };

  let agreement = await fetchAgreement();

  const participants = agreement.participants ?? [];
  const currentUserId = user?.id;
  const currentUserEmail = user?.email?.toLowerCase();
  const participant = participants.find((row) => {
    if (currentUserId && row.user_id === currentUserId) return true;
    if (currentUserEmail) return row.email.toLowerCase() === currentUserEmail;
    return false;
  });

  if (!participant && user?.is_agent) {
    if (!agreement.docusign_envelope_id && agreement.status === "draft") {
      const sendResponse = await docusignApi.sendAgreement(agreementId, {
        signing_method: "email",
      });
      if (!sendResponse.success) {
        throw new Error(
          sendResponse.error ?? "Failed to send agreement to DocuSign",
        );
      }
      agreement = await waitForEnvelope();
    }

    if (!agreement.docusign_envelope_id) {
      throw new Error(
        "Agreement is still being prepared in DocuSign. Please try again shortly.",
      );
    }

    const senderViewResponse = await docusignApi.getSenderViewUrl(agreementId);
    const senderUrl = senderViewResponse.sender_url;
    if (!senderViewResponse.success || !senderUrl) {
      throw new Error(
        senderViewResponse.error ?? "Failed to get sender view URL",
      );
    }
    const win = getWindow();
    if (!win?.open) {
      throw new Error("Unable to open signing window");
    }
    win.open(senderUrl, "_blank", "noopener,noreferrer");
    return;
  }

  if (!participant) {
    throw new Error("You are not a participant on this agreement");
  }

  if (!agreement.docusign_envelope_id && agreement.status === "draft") {
    log.info(
      LOG_CATEGORIES.DOCUSIGN,
      "Agreement not sent yet, sending to DocuSign...",
      {
        agreementId,
        status: agreement.status,
        participantId: participant.id,
      },
    );
    const sendResponse = await docusignApi.sendAgreement(agreementId, {
      signing_method: "embedded",
      participant_user_id: participant.user_id,
    });
    if (!sendResponse.success) {
      log.error(
        LOG_CATEGORIES.DOCUSIGN,
        "Failed to send agreement to DocuSign",
        {
          agreementId,
          error: sendResponse.error,
        },
      );
      throw new Error(
        sendResponse.error ?? "Failed to send agreement to DocuSign",
      );
    }
    log.debug(
      LOG_CATEGORIES.DOCUSIGN,
      "Agreement sent, waiting for envelope creation...",
      {
        agreementId,
      },
    );
    agreement = await waitForEnvelope();
  }

  if (!agreement.docusign_envelope_id) {
    log.info(LOG_CATEGORIES.DOCUSIGN, "Envelope not ready yet, waiting...", {
      agreementId,
      status: agreement.status,
    });
    agreement = await waitForEnvelope();
    if (!agreement.docusign_envelope_id) {
      log.error(
        LOG_CATEGORIES.DOCUSIGN,
        "DocuSign envelope creation timeout - envelope not created after waiting",
        {
          agreementId,
          status: agreement.status,
          participantCount: agreement.participants?.length ?? 0,
        },
      );
      throw new Error(
        "DocuSign is still processing this agreement. This usually takes 10-20 seconds. Please wait a moment and try signing again.",
      );
    }
  }

  const signingUrlResponse = await docusignApi.getSigningUrl(agreementId, {
    participant_id: participant.id,
  });
  const signingUrl = signingUrlResponse.signing_url;
  if (!signingUrlResponse.success || !signingUrl) {
    throw new Error(signingUrlResponse.error ?? "Failed to get signing URL");
  }

  const win = getWindow();
  if (!win?.open) {
    throw new Error("Unable to open signing window");
  }
  win.open(signingUrl, "_blank", "noopener,noreferrer");
}
