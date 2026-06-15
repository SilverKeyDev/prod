import {
  TRANSACTION_SHELL_CONFIGS,
  transactionPartyFromWorkspace,
  type TransactionShellConfig,
} from "packages/utils/product/workspace";

import { useActiveWorkspace } from "./useActiveWorkspace";

/**
 * Party-keyed shell config for hub/checklists/search. Prefer passing explicit `party` into
 * pure components; use this hook at workspace shell boundaries.
 */
export function useTransactionShellConfig(): TransactionShellConfig {
  const workspace = useActiveWorkspace();
  const party = transactionPartyFromWorkspace(workspace);
  return TRANSACTION_SHELL_CONFIGS[party];
}
