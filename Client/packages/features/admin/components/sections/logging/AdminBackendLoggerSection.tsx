import type { UseMutationResult } from "@tanstack/react-query";

import type { AdminSectionBaseProps } from "packages/features/admin/types/adminScope";
import { DEFAULT_ADMIN_SCOPE } from "packages/features/admin/types/adminScope";
import {
  ADMIN_LOGGER_UI_GROUPS,
  LOGGER_CONFIG_KEY_TO_LOG_PATH,
} from "packages/logger/config/adminLoggerUiMeta.generated";
import type { components } from "packages/types/api.generated";
import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { AccessibleCheckboxInput, BodyText, Dropdown, Label, Title } from "@/components/ui";

import { AdminLoggerCategoryGroup } from "./adminLoggerCategoryGroup";

type ServerLoggerConfig = components["schemas"]["ServerLoggerConfig"];
type ServerLoggerConfigPatch = components["schemas"]["ServerLoggerConfigPatch"];
type DeploymentLoggerConfig = components["schemas"]["DeploymentLoggerConfig"];
type DeploymentLoggerConfigUpdates = components["schemas"]["DeploymentLoggerConfigUpdates"];

const LOG_LEVELS: ServerLoggerConfig["logLevel"][] = ["DEBUG", "INFO", "WARN", "ERROR"];
const ALWAYS_ON_KEYS = new Set(ADMIN_LOGGER_UI_GROUPS.alwaysEnabled.keys);

type AdminBackendLoggerSectionProps = AdminSectionBaseProps & {
  serverConfig: ServerLoggerConfig;
  mutation: UseMutationResult<
    DeploymentLoggerConfig,
    Error,
    DeploymentLoggerConfigUpdates,
    unknown
  >;
};

export function AdminBackendLoggerSection({
  scope: _scope = DEFAULT_ADMIN_SCOPE,
  serverConfig,
  mutation,
}: AdminBackendLoggerSectionProps) {
  const applyServerPatch = (partial: ServerLoggerConfigPatch) => {
    mutation.mutate({ server: partial });
  };

  const handleToggle = (key: string) => {
    if (ALWAYS_ON_KEYS.has(key)) return;
    if (typeof serverConfig[key] !== "boolean") return;
    applyServerPatch({ [key]: !serverConfig[key] } as ServerLoggerConfigPatch);
  };

  return (
    <Card border="light" padding="lg" className="w-full">
      <Title size="lg" as="h2" className="mb-2">
        Server logger (API process)
      </Title>
      <BodyText size="sm" muted className="mb-4">
        Debugging toggles for the Flask API process. Changes persist to the deployment store and
        apply immediately in this running process (also reloaded on server startup). PostHog
        receives server logs when POSTHOG_PROJECT_TOKEN is set.
      </BodyText>

      <Box className="grid gap-6 md:grid-cols-2">
        <Box className="space-y-6">
          <AdminLoggerCategoryGroup
            groupKey="core"
            config={serverConfig}
            isPending={mutation.isPending}
            onToggle={handleToggle}
          />
          <Box className="space-y-3">
            <Title size="sm" as="h3" className="mb-1">
              {LOGGER_CONFIG_KEY_TO_LOG_PATH.api ?? "API"}
            </Title>
            <Label size="sm" className="flex items-center gap-2">
              <AccessibleCheckboxInput
                checked={Boolean(serverConfig.api)}
                disabled={mutation.isPending}
                className="border-border accent-primary focus:ring-primary/30 h-4 w-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-0"
                label="Toggle API"
                onChange={() => handleToggle("api")}
              />
              <BodyText as="span" size="sm">
                {LOGGER_CONFIG_KEY_TO_LOG_PATH.api ?? "API"}
              </BodyText>
            </Label>
          </Box>
          <AdminLoggerCategoryGroup
            groupKey="features"
            config={serverConfig}
            isPending={mutation.isPending}
            onToggle={handleToggle}
          />
          <AdminLoggerCategoryGroup
            groupKey="alwaysEnabled"
            config={serverConfig}
            readOnlyKeys={ALWAYS_ON_KEYS}
            isPending={mutation.isPending}
            onToggle={handleToggle}
          />
        </Box>
        <Box>
          <Label size="sm">Log level</Label>
          <Dropdown
            className="mt-1"
            label="Log level"
            hideLabel
            size="sm"
            disabled={mutation.isPending}
            options={LOG_LEVELS.map((lvl) => ({ value: lvl, label: lvl }))}
            value={serverConfig.logLevel}
            onChange={(value) => applyServerPatch({ logLevel: value })}
          />
        </Box>
      </Box>
      {mutation.isError ? (
        <BodyText size="xs" className="mt-4 text-red-600">
          {mutation.error instanceof Error ? mutation.error.message : "Update failed"}
        </BodyText>
      ) : null}
    </Card>
  );
}
