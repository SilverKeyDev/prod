import type { UseMutationResult } from "@tanstack/react-query";

import type { AdminSectionBaseProps } from "packages/features/admin/types/adminScope";
import { DEFAULT_ADMIN_SCOPE } from "packages/features/admin/types/adminScope";
import {
  SERVER_CORE_LOGGER_BOOLEAN_KEYS,
  SERVER_EXTRA_LOGGER_BOOLEAN_KEYS,
} from "packages/logger/config/adminLoggerKeys.generated";
import type { components } from "packages/types/api.generated";
import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { AccessibleCheckboxInput, BodyText, Dropdown, Label, Title } from "@/components/ui";

type ServerLoggerConfig = components["schemas"]["ServerLoggerConfig"];
type DeploymentLoggerConfig = components["schemas"]["DeploymentLoggerConfig"];
type DeploymentLoggerConfigUpdates = components["schemas"]["DeploymentLoggerConfigUpdates"];

const CORE_BOOL_KEYS =
  SERVER_CORE_LOGGER_BOOLEAN_KEYS satisfies readonly (keyof ServerLoggerConfig)[];

const LEVELS: ServerLoggerConfig["logLevel"][] = ["DEBUG", "INFO", "WARN", "ERROR"];

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
  const extras = SERVER_EXTRA_LOGGER_BOOLEAN_KEYS.filter(
    (key) => typeof serverConfig[key] === "boolean"
  );

  const toggle = (key: keyof ServerLoggerConfig) => {
    if (typeof serverConfig[key] !== "boolean") return;
    mutation.mutate({ server: { [key]: !serverConfig[key] } as Partial<ServerLoggerConfig> });
  };

  return (
    <Card border="light" padding="lg" className="w-full">
      <Title size="lg" as="h2" className="mb-2">
        Server logger
      </Title>
      <BodyText size="sm" muted className="mb-4">
        Deployment logger settings for the API process. Changes persist to the database and apply on
        the next server restart (and immediately in this running process). PostHog receives all
        server log categories when POSTHOG_PROJECT_TOKEN is set.
      </BodyText>

      <Box className="grid gap-4 md:grid-cols-2">
        <Box className="space-y-3">
          <Title size="sm" as="h3" className="mb-1">
            Categories
          </Title>
          {CORE_BOOL_KEYS.map((key) => (
            <Label key={key} size="sm" className="flex items-center gap-2">
              <AccessibleCheckboxInput
                checked={Boolean(serverConfig[key])}
                disabled={mutation.isPending}
                className="border-border accent-primary focus:ring-primary/30 h-4 w-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-0"
                label={`Toggle server ${String(key)}`}
                onChange={() => toggle(key)}
              />
              <BodyText as="span" size="sm" className="capitalize">
                {String(key)}
              </BodyText>
            </Label>
          ))}
          {extras.map((key) => (
            <Label key={key} size="sm" className="flex items-center gap-2">
              <AccessibleCheckboxInput
                checked={Boolean(serverConfig[key])}
                disabled={mutation.isPending}
                className="border-border accent-primary focus:ring-primary/30 h-4 w-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-0"
                label={`Toggle server ${String(key)}`}
                onChange={() => toggle(key)}
              />
              <BodyText as="span" size="sm">
                {String(key)}
              </BodyText>
            </Label>
          ))}
        </Box>
        <Box>
          <Label size="sm">Log level</Label>
          <Dropdown
            className="mt-1"
            label="Log level"
            hideLabel
            size="sm"
            disabled={mutation.isPending}
            options={LEVELS.map((lvl) => ({ value: lvl, label: lvl }))}
            value={serverConfig.logLevel}
            onChange={(value) => mutation.mutate({ server: { logLevel: value } })}
          />
          <BodyText size="xs" muted className="mt-3">
            Checkbox and level changes persist to deployment config when toggled.
          </BodyText>
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
