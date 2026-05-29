import { useEffect } from "react";

import type { UseMutationResult } from "@tanstack/react-query";

import type { AdminSectionBaseProps } from "packages/features/admin/types/adminScope";
import { DEFAULT_ADMIN_SCOPE } from "packages/features/admin/types/adminScope";
import { log, LOG_CATEGORIES, type LoggerConfig } from "packages/logger";
import {
  API_SUBCATEGORY_CONFIG_KEYS,
  FRONTEND_LOGGER_BOOLEAN_KEYS,
} from "packages/logger/config/adminLoggerKeys.generated";
import type { components } from "packages/types/api.generated";
import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { AccessibleCheckboxInput, BodyText, Dropdown, Label, Title } from "@/components/ui";

type ClientLoggerConfig = components["schemas"]["ClientLoggerConfig"];
type DeploymentLoggerConfig = components["schemas"]["DeploymentLoggerConfig"];
type DeploymentLoggerConfigUpdates = components["schemas"]["DeploymentLoggerConfigUpdates"];

type BooleanConfigKey = (typeof FRONTEND_LOGGER_BOOLEAN_KEYS)[number];

const LOG_LEVELS: LoggerConfig["logLevel"][] = ["DEBUG", "INFO", "WARN", "ERROR"];

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

  const applyPartial = (partial: Partial<LoggerConfig>) => {
    try {
      mutation.mutate({ client: partial as ClientLoggerConfig });
      log.security(LOG_CATEGORIES.SECURITY, "[ADMIN_PAGE] Updated frontend logger config", {
        fields: Object.keys(partial),
      });
    } catch (error) {
      log.error(
        LOG_CATEGORIES.ERRORS,
        "[ADMIN_PAGE] Failed to update frontend logger config",
        error
      );
    }
  };

  const handleToggleBoolean = (key: BooleanConfigKey) => {
    applyPartial({ [key]: !clientConfig[key] });
  };

  const handleApiToggle = (key: keyof NonNullable<LoggerConfig["api"]>) => {
    if (!clientConfig?.api || typeof clientConfig.api !== "object") return;
    const currentApi = clientConfig.api as NonNullable<LoggerConfig["api"]>;
    applyPartial({
      api: {
        ...currentApi,
        [key]: !currentApi[key],
      },
    });
  };

  const handleLogLevelChange = (value: LoggerConfig["logLevel"]) => {
    if (clientConfig.logLevel === value) return;
    applyPartial({ logLevel: value });
  };

  return (
    <Card border="light" padding="lg" className="w-full">
      <Title size="lg" as="h2" className="mb-2">
        Frontend logger
      </Title>
      <BodyText size="sm" muted className="mb-4">
        Deployment logger settings for the client. Changes persist to the database and apply to this
        browser tab when you open this page. In production builds, category guards still force
        categories on regardless of these toggles.
      </BodyText>

      <Box className="grid gap-4 md:grid-cols-2">
        <Box className="space-y-3">
          <Title size="sm" as="h3" className="mb-1">
            Categories
          </Title>
          {FRONTEND_LOGGER_BOOLEAN_KEYS.map((key) => (
            <Label key={String(key)} size="sm" className="flex items-center gap-2">
              <AccessibleCheckboxInput
                checked={Boolean(clientConfig[key])}
                disabled={mutation.isPending}
                className="border-border accent-primary focus:ring-primary/30 h-4 w-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-0"
                label={`Toggle ${String(key)}`}
                onChange={() => handleToggleBoolean(key)}
              />
              <BodyText as="span" size="sm" className="capitalize">
                {String(key)}
              </BodyText>
            </Label>
          ))}
        </Box>

        <Box className="space-y-3">
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
            <BodyText size="xs" muted className="mt-3">
              Checkbox and level changes persist to deployment config when toggled.
            </BodyText>
          </Box>

          {apiConfig && (
            <Box className="space-y-2">
              <Title size="sm" as="h3" className="mb-1">
                API subcategories
              </Title>
              {API_SUBCATEGORY_CONFIG_KEYS.map((k) => (
                <Label key={k} size="sm" className="flex items-center gap-2">
                  <AccessibleCheckboxInput
                    checked={Boolean(apiConfig[k])}
                    disabled={mutation.isPending}
                    className="border-border accent-primary focus:ring-primary/30 h-4 w-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-0"
                    label={`Toggle API ${k}`}
                    onChange={() => handleApiToggle(k)}
                  />
                  <BodyText as="span" size="sm" className="capitalize">
                    {k}
                  </BodyText>
                </Label>
              ))}
            </Box>
          )}
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
