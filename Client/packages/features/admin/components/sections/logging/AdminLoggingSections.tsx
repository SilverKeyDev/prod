import { Box } from "packages/ui/components/primitives";

import { AdminBackendLoggerSection } from "./AdminBackendLoggerSection";
import { AdminFrontendLoggerSection } from "./AdminFrontendLoggerSection";

export function AdminLoggingSections() {
  return (
    <Box className="flex flex-col gap-6">
      <AdminFrontendLoggerSection />
      <AdminBackendLoggerSection />
    </Box>
  );
}
