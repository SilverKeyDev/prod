import { useEffect } from "react";

import type { UseMutationResult } from "@tanstack/react-query";

import type { AdminSectionBaseProps } from "packages/features/admin/types/adminScope";
import { DEFAULT_ADMIN_SCOPE } from "packages/features/admin/types/adminScope";
import { log, type LoggerConfig } from "packages/logger";
import { API_SUBCATEGORY_CONFIG_KEYS } from "packages/logger/config/adminLoggerKeys.generated";
import {
  ADMIN_LOGGER_UI_GROUPS,
  API_SUBCATEGORY_CONFIG_KEY_TO_LOG_PATH,
  LOGGER_CONFIG_KEY_TO_LOG_PATH,
} from "packages/logger/config/adminLoggerUiMeta.generated";
import type { components } from "packages/types/api.generated";
import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { AccessibleCheckboxInput, BodyText, Dropdown, Label, Title } from "@/components/ui";

import { AdminLoggerCategoryGroup } from "./adminLoggerCategoryGroup";

type ClientLoggerConfig = components["schemas"]["ClientLoggerConfig"];
type ClientLoggerConfigPatch = components["schemas"]["ClientLoggerConfigPatch"];
type DeploymentLoggerConfig = components["schemas"]["DeploymentLoggerConfig"];
type DeploymentLoggerConfigUpdates = components["schemas"]["DeploymentLoggerConfigUpdates"];

const LOG_LEVELS: LoggerConfig["logLevel"][] = ["DEBUG", "INFO", "WARN", "ERROR"];
const ALWAYS_ON_KEYS = new Set(ADMIN_LOGGER_UI_GROUPS.alwaysEnabled.keys);

type AdminFrontendLoggerSectionProps = AdminSectionBaseProps & {
  clientConfig: ClientLoggerConfig;
  mutation: UseMutationResult<
    DeploymentLoggerConfig,
    Error,
    DeploymentLoggerConfigUpdates,
    unknown
  >;
};

export function AdminFrontendLoggerSection({
  scope: _scope = DEFAULT_ADMIN_SCOPE,
  clientConfig,
  mutation,
}: AdminFrontendLoggerSectionProps) {
  useEffect(() => {
    log.updateConfig(clientConfig as Partial<LoggerConfig>);
  }, [clientConfig]);

  const apiConfig =
    clientConfig && typeof clientConfig.api === "object" ? clientConfig.api : undefined;

  const applyClientPatch = (partial: ClientLoggerConfigPatch) => {
    mutation.mutate({ client: partial });
    log.security("SECURITY", "[ADMIN_PAGE] Updated frontend logger config", {
      fields: Object.keys(partial),
    });
  };

  const handleToggleBoolean = (key: string) => {
    if (ALWAYS_ON_KEYS.has(key)) return;
    applyClientPatch({ [key]: !clientConfig[key] } as ClientLoggerConfigPatch);
  };

  const handleApiMasterToggle = () => {
    if (typeof clientConfig.api === "boolean") {
      applyClientPatch({ api: !clientConfig.api });
    }
  };

  const handleApiToggle = (key: keyof NonNullable<LoggerConfig["api"]>) => {
    if (!apiConfig) return;
    applyClientPatch({
      api: {
        ...apiConfig,
        [key]: !apiConfig[key],
      },
    });
  };

  const handleLogLevelChange = (value: LoggerConfig["logLevel"]) => {
    if (clientConfig.logLevel === value) return;
    applyClientPatch({ logLevel: value });
  };

  return (
    <Card border="light" padding="lg" className="w-full">
      <Title size="lg" as="h2" className="mb-2">
        Frontend logger (this tab)
      </Title>
      <BodyText size="sm" muted className="mb-4">
        Personal admin debugging for your current browser session. Toggles persist to the shared
        deployment store but only apply here while this page is open — not for other users or tabs.
        Production builds still force categories on regardless of these toggles.
      </BodyText>

      <Box className="grid gap-6 md:grid-cols-2">
        <Box className="space-y-6">
          <AdminLoggerCategoryGroup
            groupKey="core"
            config={clientConfig}
            isPending={mutation.isPending}
            onToggle={handleToggleBoolean}
          />
          <AdminLoggerCategoryGroup
            groupKey="features"
            config={clientConfig}
            isPending={mutation.isPending}
            onToggle={handleToggleBoolean}
          />
          <AdminLoggerCategoryGroup
            groupKey="alwaysEnabled"
            config={clientConfig}
            readOnlyKeys={ALWAYS_ON_KEYS}
            isPending={mutation.isPending}
            onToggle={handleToggleBoolean}
          />
        </Box>

        <Box className="space-y-6">
          <Box>
            <Label size="sm">Log level</Label>
            <Dropdown
              className="mt-1"
              label="Log level"
              hideLabel
              size="sm"
              disabled={mutation.isPending}
              options={LOG_LEVELS.map((lvl) => ({ value: lvl, label: lvl }))}
              value={clientConfig.logLevel}
              onChange={handleLogLevelChange}
            />
          </Box>

          <Box className="space-y-3">
            <Title size="sm" as="h3" className="mb-1">
              {LOGGER_CONFIG_KEY_TO_LOG_PATH.api ?? "API"}
            </Title>
            {typeof clientConfig.api === "boolean" ? (
              <Label size="sm" className="flex items-center gap-2">
                <AccessibleCheckboxInput
                  checked={clientConfig.api}
                  disabled={mutation.isPending}
                  className="border-border accent-primary focus:ring-primary/30 h-4 w-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-0"
                  label="Toggle API"
                  onChange={handleApiMasterToggle}
                />
                <BodyText as="span" size="sm">
                  All API subcategories
                </BodyText>
              </Label>
            ) : null}
            {apiConfig ? (
              <Box className="space-y-2">
                {API_SUBCATEGORY_CONFIG_KEYS.map((k) => (
                  <Label key={k} size="sm" className="flex items-center gap-2">
                    <AccessibleCheckboxInput
                      checked={Boolean(apiConfig[k])}
                      disabled={mutation.isPending}
                      className="border-border accent-primary focus:ring-primary/30 h-4 w-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-0"
                      label={`Toggle API ${k}`}
                      onChange={() => handleApiToggle(k)}
                    />
                    <BodyText as="span" size="sm">
                      {API_SUBCATEGORY_CONFIG_KEY_TO_LOG_PATH[k] ?? k}
                    </BodyText>
                  </Label>
                ))}
              </Box>
            ) : null}
          </Box>
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
