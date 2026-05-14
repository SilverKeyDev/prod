import { AdminDocuSignDiagnosticsSection } from "packages/features/admin/components/sections/integrations/AdminDocuSignDiagnosticsSection";
import { useAuthStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";

export function AdminPartnersSection() {
  const isAgent = useAuthStore((s) => s.user?.is_agent ?? false);

  return (
    <Box className="flex flex-col gap-6">
      <Card border="light" padding="lg" className="w-full">
        <AdminDocuSignDiagnosticsSection isAgent={isAgent} />
      </Card>
    </Box>
  );
}
