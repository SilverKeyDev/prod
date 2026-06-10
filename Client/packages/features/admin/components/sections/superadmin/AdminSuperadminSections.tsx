import type { AdminSectionBaseProps } from "packages/features/admin/types/adminScope";
import { DEFAULT_ADMIN_SCOPE } from "packages/features/admin/types/adminScope";
import { Box } from "packages/ui/components/structure/primitives";

import { AdminDeleteUserSection } from "./AdminDeleteUserSection";
import { AdminGateUsersListSection } from "./AdminGateUsersListSection";
import { AdminUserSystemRolesSection } from "./AdminUserSystemRolesSection";

export function AdminSuperadminSections({ scope = DEFAULT_ADMIN_SCOPE }: AdminSectionBaseProps) {
  return (
    <Box className="flex flex-col gap-6">
      <AdminGateUsersListSection scope={scope} />
      <AdminUserSystemRolesSection scope={scope} />
      <AdminDeleteUserSection scope={scope} />
    </Box>
  );
}
