import { Box } from "packages/ui/components/primitives";

import { AdminDeleteUserSection } from "./AdminDeleteUserSection";
import { AdminUserSystemRolesSection } from "./AdminUserSystemRolesSection";

export function AdminSuperadminSections() {
  return (
    <Box className="flex flex-col gap-6">
      <AdminUserSystemRolesSection />
      <AdminDeleteUserSection />
    </Box>
  );
}
