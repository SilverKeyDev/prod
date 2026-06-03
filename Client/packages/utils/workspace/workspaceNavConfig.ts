import type { Workspace } from "./deriveAllowedWorkspaces";
import { isPlaceholderWorkspace } from "./isPlaceholderWorkspace";

/** Matches `SidebarTabKey` in apps/web sidebar — kept in packages to avoid app imports. */
export type WorkspaceNavTabKey = "dashboard" | "search" | "decide" | "agent" | "profile";

export type WorkspaceNavTabConfig = {
  key: WorkspaceNavTabKey;
  /** i18n key resolved via WORKSPACE_TRANSLATIONS */
  labelKey: string;
  visible: boolean;
};

const TAB_ORDER: WorkspaceNavTabKey[] = ["dashboard", "search", "decide", "agent", "profile"];

function labelKeyForTab(workspace: Workspace, key: WorkspaceNavTabKey): string {
  switch (key) {
    case "dashboard":
      if (isPlaceholderWorkspace(workspace)) {
        return "workspace.nav.dashboard.placeholder";
      }
      return `workspace.nav.dashboard.${workspace}`;
    case "search":
      return "workspace.nav.search";
    case "decide":
      return workspace === "agent" ? "workspace.nav.library.agent" : "workspace.nav.library.buyer";
    case "agent":
      if (isPlaceholderWorkspace(workspace)) {
        return "workspace.nav.messaging.placeholder";
      }
      return `workspace.nav.messaging.${workspace}`;
    case "profile":
      return "workspace.nav.profile";
    default:
      return "workspace.nav.profile";
  }
}

function isTabVisible(workspace: Workspace, key: WorkspaceNavTabKey, _isMobile: boolean): boolean {
  if (isPlaceholderWorkspace(workspace)) {
    return key === "dashboard" || key === "agent";
  }
  return true;
}

/**
 * Per-workspace nav tab visibility and label keys (canonical hrefs unchanged).
 */
export function getWorkspaceNavTabs(
  workspace: Workspace,
  isMobile: boolean
): WorkspaceNavTabConfig[] {
  return TAB_ORDER.map((key) => ({
    key,
    labelKey: labelKeyForTab(workspace, key),
    visible: isTabVisible(workspace, key, isMobile),
  })).filter((tab) => tab.visible);
}

export function workspaceSwitcherLabelKey(workspace: Workspace): string {
  return `workspace.switcher.${workspace}`;
}
