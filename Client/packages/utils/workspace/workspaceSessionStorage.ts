import { getSessionStorage } from "packages/utils/storage/platformStorage";

import type { Workspace } from "./deriveAllowedWorkspaces";
import { isWorkspace } from "./deriveAllowedWorkspaces";

export const ACTIVE_WORKSPACE_SESSION_KEY = "silverkey_active_workspace_v1";
export const DEV_WORKSPACE_PREVIEW_SESSION_KEY = "silverkey_dev_workspace_preview_v1";

export function readPersistedActiveWorkspace(): Workspace | null {
  try {
    const raw = getSessionStorage().getItem(ACTIVE_WORKSPACE_SESSION_KEY);
    if (!raw || !isWorkspace(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

export function writePersistedActiveWorkspace(workspace: Workspace | null): void {
  try {
    const storage = getSessionStorage();
    if (workspace === null) {
      storage.removeItem(ACTIVE_WORKSPACE_SESSION_KEY);
    } else {
      storage.setItem(ACTIVE_WORKSPACE_SESSION_KEY, workspace);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function readDevWorkspacePreviewEnabled(): boolean {
  try {
    return getSessionStorage().getItem(DEV_WORKSPACE_PREVIEW_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeDevWorkspacePreviewEnabled(enabled: boolean): void {
  try {
    const storage = getSessionStorage();
    if (enabled) {
      storage.setItem(DEV_WORKSPACE_PREVIEW_SESSION_KEY, "1");
    } else {
      storage.removeItem(DEV_WORKSPACE_PREVIEW_SESSION_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}
