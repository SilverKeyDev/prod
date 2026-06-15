import { AdminPartnersSection } from "packages/features/admin";

import { SuperAdminGuard } from "@/app/guards/auth";

export default function AdminPartnersOutlet() {
  return (
    <SuperAdminGuard>
      <AdminPartnersSection />
    </SuperAdminGuard>
  );
}
