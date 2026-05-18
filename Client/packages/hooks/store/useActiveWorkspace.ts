import { useWorkspaceStore } from "packages/store/slices/workspace/workspace.slice";
import type { Workspace } from "packages/utils/workspace";

/**
 * Canonical UX workspace for Layer 2/3 UI (buyer | seller | agent | brokerage).
 * For server identity (API eligibility), use useIsAgent() / auth user fields.
 */
export function useActiveWorkspace(): Workspace {
  return useWorkspaceStore((s) => s.activeWorkspace ?? "buyer");
}

export function useAllowedWorkspaces(): Workspace[] {
  return useWorkspaceStore((s) => s.allowedWorkspaces);
}

export function useSetActiveWorkspace(): (workspace: Workspace) => void {
  return useWorkspaceStore((s) => s.setActiveWorkspace);
}
