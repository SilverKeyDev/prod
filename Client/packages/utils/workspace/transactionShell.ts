import type { Workspace } from "./deriveAllowedWorkspaces";

/** Party for transaction / checklist product copy and server scoping (buyer vs seller journey). */
export type TransactionParty = "buyer" | "seller";

export type TransactionShellConfig = {
  party: TransactionParty;
};

export const TRANSACTION_SHELL_CONFIGS: Record<TransactionParty, TransactionShellConfig> = {
  buyer: { party: "buyer" },
  seller: { party: "seller" },
};

export function transactionPartyFromWorkspace(workspace: Workspace): TransactionParty {
  if (workspace === "seller") return "seller";
  return "buyer";
}
