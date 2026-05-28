import type { SetActiveWorkspaceOptions } from "packages/store/slices/workspace/workspace.slice";
import { useWorkspaceStore } from "packages/store/slices/workspace/workspace.slice";
import { ALL_WORKSPACES, type Workspace } from "packages/utils/workspace";

/**
 * Canonical UX workspace for Layer 2/3 UI (buyer | seller | agent | brokerage | integration_partner).
 * For server identity (API eligibility), use useIsAgent() / auth user fields.
 */
export function useActiveWorkspace(): Workspace {
  return useWorkspaceStore((s) => s.activeWorkspace ?? "buyer");
}

export function useAllowedWorkspaces(): Workspace[] {
  const allowed = useWorkspaceStore((s) => s.allowedWorkspaces);
  const devPreview = useWorkspaceStore((s) => s.devPreviewAllWorkspaces);
  return devPreview ? [...ALL_WORKSPACES] : allowed;
}

export function useSetActiveWorkspace(): (
  workspace: Workspace,
  options?: SetActiveWorkspaceOptions
) => void {
  return useWorkspaceStore((s) => s.setActiveWorkspace);
}
