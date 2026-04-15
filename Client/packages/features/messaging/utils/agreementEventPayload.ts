export type AgreementEventPayload = {
  agreement_id: string;
  title: string;
  status: string;
  event: "sent" | "client_signed" | "agent_signed" | "completed";
  /** Present on newer "sent" messages: user id of the signer whose turn it is (sequential routing). */
  next_signer_user_id?: string;
};

/** In-thread card headline (full sentence). */
export const AGREEMENT_EVENT_HEADLINES: Record<
  AgreementEventPayload["event"],
  string
> = {
  sent: "Document sent for signature",
  client_signed: "Client signed the document",
  agent_signed: "Agent countersigned the document",
  completed: "All parties have signed",
};

/** Short sidebar / list preview by lifecycle event (matches server `event` field). */
export const AGREEMENT_EVENT_PREVIEW_LABELS: Record<
  AgreementEventPayload["event"],
  string
> = {
  sent: "Request for signature",
  client_signed: "Client signed",
  agent_signed: "Agent signed",
  completed: "Document completed",
};

export const AGREEMENT_EVENT_PREFIX = "__AGREEMENT_EVENT__";

export function getAgreementEventPreviewLabel(event: string): string {
  if (event in AGREEMENT_EVENT_PREVIEW_LABELS) {
    return AGREEMENT_EVENT_PREVIEW_LABELS[
      event as AgreementEventPayload["event"]
    ];
  }
  return "Agreement update";
}

export function parseAgreementEventPayload(
  content: string | null | undefined,
): AgreementEventPayload | null {
  if (content == null || typeof content !== "string") return null;
  const trimmed = content.trim();
  const idx = trimmed.indexOf(AGREEMENT_EVENT_PREFIX);
  if (idx === -1) return null;

  const afterPrefix = trimmed.slice(idx + AGREEMENT_EVENT_PREFIX.length).trim();
  const firstLine = afterPrefix.split("\n")[0]?.trim() ?? "";
  if (!firstLine) return null;

  try {
    const parsed = JSON.parse(firstLine) as Record<string, unknown>;
    if (
      typeof parsed.agreement_id === "string" &&
      typeof parsed.title === "string" &&
      typeof parsed.event === "string"
    ) {
      return parsed as unknown as AgreementEventPayload;
    }
  } catch {
    /* malformed payload */
  }
  return null;
}
