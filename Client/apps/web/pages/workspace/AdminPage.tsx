import { AdminGuard } from "packages/features/admin/components/guards/AdminGuard";
import { AdminWorkspaceLayout } from "packages/features/admin/components/layout/AdminWorkspaceLayout.web";

import { AuthGuard } from "@/app/guards";

export default function AdminPage() {
  return (
    <AuthGuard>
      <AdminGuard>
        <AdminWorkspaceLayout />
      </AdminGuard>
    </AuthGuard>
  );
}
