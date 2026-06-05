import { create } from "zustand";

import { withDevtools } from "packages/store/middleware/devtools";
import {
  deriveAllowedWorkspaces,
  type DeriveAllowedWorkspacesInput,
  type Workspace,
} from "packages/utils/product/workspace";
import {
  readPersistedActiveWorkspace,
  writePersistedActiveWorkspace,
} from "packages/utils/product/workspace/workspaceSessionStorage";

export type { Workspace } from "packages/utils/product/workspace";

export type WorkspaceState = {
  allowedWorkspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace) => void;
  /**
   * Recomputes allowed workspaces from identity and reconciles persisted active workspace.
   * Call when auth user or profile roles change. Pass null user to reset.
   */
  syncFromIdentity: (input: {
    user: {
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

function pickInitialActive(allowed: Workspace[], persisted: Workspace | null): Workspace {
  if (persisted && allowed.includes(persisted)) return persisted;
  return allowed[0] ?? "buyer";
}

const initialState = (): Pick<WorkspaceState, "allowedWorkspaces" | "activeWorkspace"> => ({
  allowedWorkspaces: ["buyer"],
  activeWorkspace: "buyer",
});

const baseCreator: import("zustand").StateCreator<WorkspaceState> = (set, get) => ({
  ...initialState(),

  setActiveWorkspace: (workspace) => {
    const { allowedWorkspaces } = get();
    if (!allowedWorkspaces.includes(workspace)) return;

    writePersistedActiveWorkspace(workspace);
    set({ activeWorkspace: workspace });
  },

  syncFromIdentity: (input) => {
    const { user, profileRoles } = input;
    if (!user) {
      writePersistedActiveWorkspace(null);
      set(initialState());
      return;
    }

    const roles = mergeRoles(user, profileRoles);
    const deriveInput: DeriveAllowedWorkspacesInput = {
      roles,
      brokerageOrgIds: user.brokerage_org_ids ?? undefined,
    };
    const allowedWorkspaces = deriveAllowedWorkspaces(deriveInput);
    const persisted = readPersistedActiveWorkspace();
    const activeWorkspace = pickInitialActive(allowedWorkspaces, persisted);
    if (activeWorkspace !== persisted) {
      writePersistedActiveWorkspace(activeWorkspace);
    }
    set({ allowedWorkspaces, activeWorkspace });
  },

  reset: () => {
    writePersistedActiveWorkspace(null);
    set(initialState());
  },
});

const withDev = withDevtools<WorkspaceState>("workspace")(baseCreator);

export const useWorkspaceStore = create<WorkspaceState>()(withDev);

/** Imperative reset for auth flows outside React (logout, token refresh failure). */
export function resetWorkspaceStore(): void {
  useWorkspaceStore.getState().reset();
}
