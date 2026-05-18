import type { AdminSectionBaseProps } from "packages/features/admin/types/adminScope";
import { DEFAULT_ADMIN_SCOPE } from "packages/features/admin/types/adminScope";
import { Box } from "packages/ui/components/primitives";

import { AdminBackendLoggerSection } from "./AdminBackendLoggerSection";
import { AdminFrontendLoggerSection } from "./AdminFrontendLoggerSection";

export function AdminLoggingSections({ scope = DEFAULT_ADMIN_SCOPE }: AdminSectionBaseProps) {
  return (
    <Box className="flex flex-col gap-6">
      <AdminFrontendLoggerSection scope={scope} />
      <AdminBackendLoggerSection scope={scope} />
    </Box>
  );
}
