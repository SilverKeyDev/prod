import type { AgentClient } from "packages/api";

export type ClientListActionInput = {
  unreadCount?: number | null;
  requiresSignature?: boolean | null;
};

export function getClientListActionInput(
  client: Pick<AgentClient, "requires_signature">,
  unreadCount?: number | null
): ClientListActionInput {
  return {
    unreadCount,
    requiresSignature: client.requires_signature,
  };
}

export function clientHasRequiredAction(input: ClientListActionInput): boolean {
  return (input.unreadCount ?? 0) > 0 || Boolean(input.requiresSignature);
}

/** Lower tier sorts first (0 = action required). */
export function clientActionSortTier(input: ClientListActionInput): number {
  return clientHasRequiredAction(input) ? 0 : 1;
}
