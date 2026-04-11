export type AgreementEventPayload = {
  agreement_id: string;
  title: string;
  status: string;
  event: "sent" | "client_signed" | "agent_signed" | "completed";
};

export const AGREEMENT_EVENT_PREFIX = "__AGREEMENT_EVENT__";

export function parseAgreementEventPayload(
  content: string | null | undefined,
): AgreementEventPayload | null {
  const trimmed = content?.trim();
  if (!trimmed?.startsWith(AGREEMENT_EVENT_PREFIX)) return null;

  const jsonStr = trimmed.slice(AGREEMENT_EVENT_PREFIX.length).trim();
  try {
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
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
