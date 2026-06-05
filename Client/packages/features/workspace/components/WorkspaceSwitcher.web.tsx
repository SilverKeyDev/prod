import { useLocalization } from "packages/contexts";
import {
  useActiveWorkspace,
  useAllowedWorkspaces,
  useSetActiveWorkspace,
} from "packages/hooks/store";
import { Button } from "packages/ui";
import { Region } from "packages/ui/components/system/accessibility";
import type { Workspace } from "packages/utils/product/workspace";
import { workspaceSwitcherLabelKey } from "packages/utils/product/workspace/workspaceNavConfig";

type WorkspaceSwitcherProps = {
  /** When true, render even with a single allowed workspace (local dev harness). */
  forceVisible?: boolean;
};

export function WorkspaceSwitcher({ forceVisible = false }: WorkspaceSwitcherProps) {
  const { t } = useLocalization();
  const allowed = useAllowedWorkspaces();
  const active = useActiveWorkspace();
  const setActive = useSetActiveWorkspace();

  const show = forceVisible || (allowed.length > 1 && allowed.length > 0);

  if (!show || allowed.length === 0) {
    return null;
  }

  return (
    <Region
      className="flex flex-wrap items-center gap-2 px-4 py-2 md:px-0"
      data-testid="workspace-switcher"
      role="group"
      label="Active workspace"
    >
      {allowed.map((workspace: Workspace) => {
        const selected = workspace === active;
        return (
          <Button
            key={workspace}
            type="button"
            size="sm"
            variant={selected ? "primary" : "secondary"}
            onPress={() => setActive(workspace)}
            label={t(workspaceSwitcherLabelKey(workspace))}
            accessibilityState={{ selected }}
          >
            {t(workspaceSwitcherLabelKey(workspace))}
          </Button>
        );
      })}
    </Region>
  );
}
