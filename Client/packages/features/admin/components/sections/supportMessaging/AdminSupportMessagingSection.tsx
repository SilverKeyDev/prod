import WorkspaceMessagingShell from "packages/features/messaging/components/workspace/WorkspaceMessagingShell";
import { Box } from "packages/ui/components/structure/primitives";

/** Super-admin support inbox embedded in the admin workspace shell (keeps admin nav visible). */
export function AdminSupportMessagingSection() {
  return (
    <Box className="relative flex min-h-[calc(100dvh-10rem)] w-full flex-1 flex-col overflow-hidden">
      <WorkspaceMessagingShell persona="admin_support" />
    </Box>
  );
}
