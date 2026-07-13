import { lazy, Suspense } from "react";

import { BodyText, Box } from "packages/ui";

const AdminWikiSection = lazy(() =>
  import("packages/features/admin/components/sections/wiki/AdminWikiSection").then((m) => ({
    default: m.AdminWikiSection,
  }))
);

export default function AdminWikiOutlet() {
  return (
    <Suspense
      fallback={
        <Box className="p-4">
          <BodyText size="sm" muted>
            Loading wiki…
          </BodyText>
        </Box>
      }
    >
      <AdminWikiSection />
    </Suspense>
  );
}
