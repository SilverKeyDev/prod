import { AdminDocuSignDiagnosticsSection } from "packages/features/admin/components/sections/integrations/AdminDocuSignDiagnosticsSection";
import type { AdminSectionBaseProps } from "packages/features/admin/types/adminScope";
import { DEFAULT_ADMIN_SCOPE } from "packages/features/admin/types/adminScope";
import { useAuthStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";

export function AdminPartnersSection({ scope = DEFAULT_ADMIN_SCOPE }: AdminSectionBaseProps) {
  const isAgent = useAuthStore((s) => s.user?.is_agent ?? false);

  return (
    <Box className="flex flex-col gap-6" data-admin-scope={scope.kind}>
      <Card border="light" padding="lg" className="w-full">
        <AdminDocuSignDiagnosticsSection isAgent={isAgent} scope={scope} />
      </Card>
    </Box>
  );
}
