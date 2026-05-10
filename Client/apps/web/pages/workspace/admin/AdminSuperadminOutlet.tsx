import { AdminSuperadminSections } from "packages/features/admin";

import { SuperAdminGuard } from "@/app/guards/auth";

export default function AdminSuperadminOutlet() {
  return (
    <SuperAdminGuard>
      <AdminSuperadminSections />
    </SuperAdminGuard>
  );
}
