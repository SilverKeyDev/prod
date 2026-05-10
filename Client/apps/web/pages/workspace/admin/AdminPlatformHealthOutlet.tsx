import { AdminPlaceholderSection } from "packages/features/admin";

export default function AdminPlatformHealthOutlet() {
  return (
    <AdminPlaceholderSection
      title="Platform health"
      description="Surface Celery queues, outage banners, migrations, feature flags, and partner connectivity once automated probes exist."
    />
  );
}
