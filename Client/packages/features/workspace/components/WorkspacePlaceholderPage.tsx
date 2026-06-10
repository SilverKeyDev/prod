import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import type { Workspace } from "packages/utils/product/workspace";
import { workspaceSwitcherLabelKey } from "packages/utils/product/workspace/workspaceNavConfig";

export type WorkspacePlaceholderPageProps = {
  workspace: Workspace;
};

function placeholderTestId(workspace: Workspace): string {
  if (workspace === "integration_partner") {
    return "workspace-shell-integration-partner";
  }
  return `workspace-shell-${workspace}`;
}

/**
 * Minimal shell for seller, renter, brokerage, and integration_partner workspaces.
 * Product tabs and flows are added incrementally per workspace.
 */
export function WorkspacePlaceholderPage({ workspace }: WorkspacePlaceholderPageProps) {
  const { t } = useLocalization();
  const roleLabel = t(workspaceSwitcherLabelKey(workspace));

  return (
    <Box
      className="flex max-w-2xl flex-col gap-4 px-4 py-8"
      data-testid={placeholderTestId(workspace)}
      data-workspace={workspace}
    >
      <BodyText size="lg" className="text-text-primary font-semibold" as="h1">
        {t("workspace.placeholder.title")}
      </BodyText>
      <BodyText size="sm" className="text-text-secondary" as="p">
        {t("workspace.placeholder.body", { role: roleLabel })}
      </BodyText>
    </Box>
  );
}
