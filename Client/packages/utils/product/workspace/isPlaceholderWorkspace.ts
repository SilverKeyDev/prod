import type { Workspace } from "./deriveAllowedWorkspaces";

const PLACEHOLDER_WORKSPACES = new Set<Workspace>([]);

/** Workspaces that ship shell-only UX until dedicated product surfaces are built. */
export function isPlaceholderWorkspace(workspace: Workspace): boolean {
  return PLACEHOLDER_WORKSPACES.has(workspace);
}
