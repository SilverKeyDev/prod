import { create } from "zustand";

import { withDevtools } from "packages/store/middleware/devtools";
import {
  ALL_WORKSPACES,
  deriveAllowedWorkspaces,
  type DeriveAllowedWorkspacesInput,
  isWorkspace,
  type Workspace,
} from "packages/utils/workspace";
import {
  readDevWorkspacePreviewEnabled,
  readPersistedActiveWorkspace,
  writeDevWorkspacePreviewEnabled,
  writePersistedActiveWorkspace,
} from "packages/utils/workspace/workspaceSessionStorage";

export type { Workspace } from "packages/utils/workspace";

export type SetActiveWorkspaceOptions = {
  /** Admin dev harness: allow any shell and keep selection across identity sync. */
  devPreview?: boolean;
};

export type WorkspaceState = {
  allowedWorkspaces: Workspace[];
  activeWorkspace: Workspace | null;
  devPreviewAllWorkspaces: boolean;
  setActiveWorkspace: (workspace: Workspace, options?: SetActiveWorkspaceOptions) => void;
  setDevPreviewAllWorkspaces: (enabled: boolean) => void;
  /**
   * Recomputes allowed workspaces from identity and reconciles persisted active workspace.
   * Call when auth user or profile roles change. Pass null user to reset.
   */
  syncFromIdentity: (input: {
    user: {
      is_agent?: boolean | null;
      roles?: readonly string[];
      brokerage_org_ids?: readonly string[] | null;
    } | null;
    profileRoles?: readonly string[] | undefined;
  }) => void;
  reset: () => void;
};

function mergeRoles(
  user: { roles?: readonly string[] } | null,
  profileRoles: readonly string[] | undefined
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (r: unknown) => {
    if (typeof r !== "string" || !r.trim()) return;
    const k = r.trim().toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(r.trim());
  };
  if (user?.roles?.length) {
    for (const r of user.roles) push(r);
  }
  if (profileRoles?.length) {
    for (const r of profileRoles) push(r);
  }
  return out;
}

function pickInitialActive(
  allowed: Workspace[],
  persisted: Workspace | null,
  devPreviewAllWorkspaces: boolean
): Workspace {
  if (devPreviewAllWorkspaces && persisted && isWorkspace(persisted)) {
    return persisted;
  }
  if (persisted && allowed.includes(persisted)) return persisted;
  return allowed[0] ?? "buyer";
}

function effectiveAllowedWorkspaces(
  identityAllowed: Workspace[],
  devPreviewAllWorkspaces: boolean
): Workspace[] {
  return devPreviewAllWorkspaces ? [...ALL_WORKSPACES] : identityAllowed;
}

const initialState = (): Pick<
  WorkspaceState,
  "allowedWorkspaces" | "activeWorkspace" | "devPreviewAllWorkspaces"
> => {
  const devPreviewAllWorkspaces = readDevWorkspacePreviewEnabled();
  return {
    allowedWorkspaces: devPreviewAllWorkspaces ? [...ALL_WORKSPACES] : ["buyer"],
    activeWorkspace: "buyer",
    devPreviewAllWorkspaces,
  };
};

const baseCreator: import("zustand").StateCreator<WorkspaceState> = (set, get) => ({
  ...initialState(),

  setActiveWorkspace: (workspace, options) => {
    const state = get();
    const devPreview = Boolean(options?.devPreview || state.devPreviewAllWorkspaces);
    const allowed = effectiveAllowedWorkspaces(state.allowedWorkspaces, devPreview);
    if (!devPreview && !allowed.includes(workspace)) return;

    if (options?.devPreview && !state.devPreviewAllWorkspaces) {
      writeDevWorkspacePreviewEnabled(true);
      set({ devPreviewAllWorkspaces: true, allowedWorkspaces: [...ALL_WORKSPACES] });
    }

    writePersistedActiveWorkspace(workspace);
    set({ activeWorkspace: workspace });
  },

  setDevPreviewAllWorkspaces: (enabled) => {
    writeDevWorkspacePreviewEnabled(enabled);
    const { allowedWorkspaces } = get();
    set({
      devPreviewAllWorkspaces: enabled,
      allowedWorkspaces: enabled ? [...ALL_WORKSPACES] : allowedWorkspaces,
    });
  },

  syncFromIdentity: (input) => {
    const { user, profileRoles } = input;
    if (!user) {
      writePersistedActiveWorkspace(null);
      writeDevWorkspacePreviewEnabled(false);
      set({ ...initialState(), devPreviewAllWorkspaces: false });
      return;
    }

    const devPreviewAllWorkspaces = get().devPreviewAllWorkspaces;
    const isAgent = Boolean(user.is_agent);
    const roles = mergeRoles(user, profileRoles);
    const deriveInput: DeriveAllowedWorkspacesInput = {
      isAgent,
      roles,
      brokerageOrgIds: user.brokerage_org_ids ?? undefined,
    };
    const identityAllowed = deriveAllowedWorkspaces(deriveInput);
    const allowedWorkspaces = effectiveAllowedWorkspaces(identityAllowed, devPreviewAllWorkspaces);
    const persisted = readPersistedActiveWorkspace();
    const activeWorkspace = pickInitialActive(
      allowedWorkspaces,
      persisted,
      devPreviewAllWorkspaces
    );
    if (activeWorkspace !== persisted) {
      writePersistedActiveWorkspace(activeWorkspace);
    }
    set({ allowedWorkspaces, activeWorkspace });
  },

  reset: () => {
    writePersistedActiveWorkspace(null);
    writeDevWorkspacePreviewEnabled(false);
    set({ ...initialState(), devPreviewAllWorkspaces: false });
  },
});

const withDev = withDevtools<WorkspaceState>("workspace")(baseCreator);

export const useWorkspaceStore = create<WorkspaceState>()(withDev);

/** Imperative reset for auth flows outside React (logout, token refresh failure). */
export function resetWorkspaceStore(): void {
  useWorkspaceStore.getState().reset();
}
