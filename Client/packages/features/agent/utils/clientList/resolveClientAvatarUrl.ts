import type { AgentClient } from "packages/api";

const HTTP_URL_PREFIX = /^https?:\/\//i;

type ConversationAvatarSource = {
  client_profile_picture?: string | null;
};

/** Presigned or absolute URLs only — never pass raw S3 keys to ProfileAvatar. */
export function resolveClientAvatarUrl(
  client: Pick<AgentClient, "profile_picture_url">,
  conversation?: ConversationAvatarSource | null
): string | null {
  const candidates = [client.profile_picture_url, conversation?.client_profile_picture];
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed && HTTP_URL_PREFIX.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
}
