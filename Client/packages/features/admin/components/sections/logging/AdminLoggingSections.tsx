import {
  useAdminLoggerConfig,
  useUpdateAdminLoggerConfig,
} from "packages/features/admin/hooks/data/useAdminLoggerConfig";
import type { AdminSectionBaseProps } from "packages/features/admin/types/adminScope";
import { DEFAULT_ADMIN_SCOPE } from "packages/features/admin/types/adminScope";
import { Box } from "packages/ui/components/structure/primitives";

import Card from "@/components/layout/Card.web";
import { BodyText } from "@/components/ui";

import { AdminBackendLoggerSection } from "./AdminBackendLoggerSection";
import { AdminFrontendLoggerSection } from "./AdminFrontendLoggerSection";

export function AdminLoggingSections({ scope = DEFAULT_ADMIN_SCOPE }: AdminSectionBaseProps) {
  const { config, isLoading, error } = useAdminLoggerConfig();
  const mutation = useUpdateAdminLoggerConfig();

  if (isLoading) {
    return (
      <Card border="light" padding="lg" className="w-full">
        <BodyText size="sm" muted>
          Loading deployment logger config…
        </BodyText>
      </Card>
    );
  }

  if (error || !config) {
    return (
      <Card border="light" padding="lg" className="w-full">
        <BodyText size="sm" muted>
          {error instanceof Error ? error.message : "Failed to load deployment logger config"}
        </BodyText>
      </Card>
    );
  }

  return (
    <Box className="flex flex-col gap-6">
      <AdminFrontendLoggerSection scope={scope} clientConfig={config.client} mutation={mutation} />
      <AdminBackendLoggerSection scope={scope} serverConfig={config.server} mutation={mutation} />
    </Box>
  );
}
