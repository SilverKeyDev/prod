import { AdminSupportMessagingSection } from "packages/features/admin";

import { SuperAdminGuard } from "@/app/guards/auth";

export default function AdminSupportMessagingOutlet() {
  return (
    <SuperAdminGuard>
      <AdminSupportMessagingSection />
    </SuperAdminGuard>
  );
}
