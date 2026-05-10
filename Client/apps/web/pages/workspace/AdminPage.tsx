import { AuthGuard } from "@/app/guards";
import { AdminGuard } from "@/app/guards/auth";
import { AdminWorkspaceLayout } from "@/app/layouts/admin/AdminWorkspaceLayout.web";

export default function AdminPage() {
  return (
    <AuthGuard>
      <AdminGuard>
        <AdminWorkspaceLayout />
      </AdminGuard>
    </AuthGuard>
  );
}
