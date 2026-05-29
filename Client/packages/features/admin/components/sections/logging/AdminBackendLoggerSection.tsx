import type { ServerLoggerConfig } from "packages/api/admin";
import type { AdminSectionBaseProps } from "packages/features/admin/types/adminScope";
import { DEFAULT_ADMIN_SCOPE } from "packages/features/admin/types/adminScope";
import {
  useAdminLoggerConfig,
  useUpdateAdminLoggerConfig,
} from "packages/hooks/data/admin/useAdminLoggerConfig";
import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { AccessibleCheckboxInput, BodyText, Dropdown, Label, Title } from "@/components/ui";

const CORE_BOOL_KEYS: (keyof ServerLoggerConfig)[] = [
  "polling",
  "pages",
  "hooks",
  "auth",
  "http",
  "api",
  "errors",
  "security",
];

const LEVELS: ServerLoggerConfig["logLevel"][] = ["DEBUG", "INFO", "WARN", "ERROR"];

export function AdminBackendLoggerSection({
  scope: _scope = DEFAULT_ADMIN_SCOPE,
}: AdminSectionBaseProps) {
  const { config, isLoading, error } = useAdminLoggerConfig();
  const mutation = useUpdateAdminLoggerConfig();

  if (isLoading) {
    return (
      <Card border="light" padding="lg" className="w-full">
        <BodyText size="sm" muted>
          Loading server logger config…
        </BodyText>
      </Card>
    );
  }

  if (error || !config) {
    return (
      <Card border="light" padding="lg" className="w-full">
        <BodyText size="sm" muted>
          {error instanceof Error ? error.message : "Failed to load server logger config"}
        </BodyText>
      </Card>
    );
  }

  const extras = (Object.keys(config) as (keyof ServerLoggerConfig & string)[]).filter(
    (k) => typeof config[k] === "boolean" && !CORE_BOOL_KEYS.includes(k as keyof ServerLoggerConfig)
  );

  const toggle = (key: keyof ServerLoggerConfig) => {
    if (typeof config[key] !== "boolean") return;
    mutation.mutate({ [key]: !config[key] } as Partial<ServerLoggerConfig>);
  };

  return (
    <Card border="light" padding="lg" className="w-full">
      <Title size="lg" as="h2" className="mb-2">
        Server logger
      </Title>
      <BodyText size="sm" muted className="mb-4">
        Updates run through the authenticated admin logger-config API for this deployment. PostHog
        receives all server log categories and levels when POSTHOG_PROJECT_TOKEN is set; fields
        below persist deployment preferences but do not gate PostHog export.
      </BodyText>

      <Box className="grid gap-4 md:grid-cols-2">
        <Box className="space-y-3">
          <Title size="sm" as="h3" className="mb-1">
            Categories
          </Title>
          {CORE_BOOL_KEYS.map((key) => (
            <Label key={key} size="sm" className="flex items-center gap-2">
              <AccessibleCheckboxInput
                checked={Boolean(config[key])}
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
                checked={Boolean(config[key])}
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
            value={config.logLevel}
            onChange={(value) => mutation.mutate({ logLevel: value })}
          />
          <BodyText size="xs" muted className="mt-3">
            Checkbox and level changes persist immediately when toggled.
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
