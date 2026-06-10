import type { AdminSectionBaseProps } from "packages/features/admin/types/adminScope";
import { DEFAULT_ADMIN_SCOPE } from "packages/features/admin/types/adminScope";
import { AdminPartnersAnalyticsTab, AdminPartnersManageTab } from "packages/features/partners";
import { Box } from "packages/ui/components/structure/primitives";

export function AdminPartnersSection({ scope = DEFAULT_ADMIN_SCOPE }: AdminSectionBaseProps) {
  return (
    <Box className="mt-6 flex flex-col gap-8" data-admin-scope={scope.kind}>
      <AdminPartnersManageTab />
      <AdminPartnersAnalyticsTab />
    </Box>
  );
}
