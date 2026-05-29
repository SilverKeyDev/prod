import { useState } from "react";

import type { AdminSectionBaseProps } from "packages/features/admin/types/adminScope";
import { DEFAULT_ADMIN_SCOPE } from "packages/features/admin/types/adminScope";
import { log, LOG_CATEGORIES, type LoggerConfig } from "packages/logger";
import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { AccessibleCheckboxInput, BodyText, Dropdown, Label, Title } from "@/components/ui";

type FrontendLoggerConfigState = LoggerConfig;

type BooleanConfigKey = Exclude<keyof FrontendLoggerConfigState, "logLevel" | "api" | string>;

const BOOLEAN_KEYS: BooleanConfigKey[] = [
  "polling",
  "pages",
  "hooks",
  "auth",
  "http",
  "search",
  "polygonSearch",
  "mapRendering",
  "propertyDetails",
  "negotiation",
  "checklists",
  "calendar",
  "dashboard",
  "messages",
  "feed",
  "routing",
  "docusign",
  "documents",
  "profilePreferences",
  "errors",
  "security",
];

const LOG_LEVELS: FrontendLoggerConfigState["logLevel"][] = ["DEBUG", "INFO", "WARN", "ERROR"];

export function AdminFrontendLoggerSection({
  scope: _scope = DEFAULT_ADMIN_SCOPE,
}: AdminSectionBaseProps) {
  const [frontendConfig, setFrontendConfig] = useState<FrontendLoggerConfigState | null>(() => {
    try {
      return log.getConfig();
    } catch {
      return null;
    }
  });
  const [frontendSaving, setFrontendSaving] = useState(false);

  const apiConfig =
    frontendConfig && typeof frontendConfig.api === "object" ? frontendConfig.api : undefined;

  const applyPartial = (partial: Partial<FrontendLoggerConfigState>) => {
    if (!frontendConfig) return;
    setFrontendSaving(true);
    try {
      log.updateConfig(partial);
      log.security(LOG_CATEGORIES.SECURITY, "[ADMIN_PAGE] Updated frontend logger config", {
        fields: Object.keys(partial),
      });
      setFrontendConfig(log.getConfig() as FrontendLoggerConfigState);
    } catch (error) {
      log.error(
        LOG_CATEGORIES.ERRORS,
        "[ADMIN_PAGE] Failed to update frontend logger config",
        error
      );
    } finally {
      setFrontendSaving(false);
    }
  };

  const handleToggleBoolean = (key: BooleanConfigKey) => {
    if (!frontendConfig) return;
    applyPartial({ [key]: !frontendConfig[key] });
  };

  const handleApiToggle = (key: keyof NonNullable<FrontendLoggerConfigState["api"]>) => {
    if (!frontendConfig?.api || typeof frontendConfig.api !== "object") return;
    const currentApi = frontendConfig.api as NonNullable<FrontendLoggerConfigState["api"]>;
    applyPartial({
      api: {
        ...currentApi,
        [key]: !currentApi[key],
      },
    });
  };

  const handleLogLevelChange = (value: FrontendLoggerConfigState["logLevel"]) => {
    if (!frontendConfig || frontendConfig.logLevel === value) return;
    applyPartial({ logLevel: value });
  };

  if (!frontendConfig) {
    return (
      <Card border="light" padding="lg" className="w-full">
        <BodyText size="sm" muted>
          Unable to read frontend logger config.
        </BodyText>
      </Card>
    );
  }

  return (
    <Card border="light" padding="lg" className="w-full">
      <Title size="lg" as="h2" className="mb-2">
        Frontend logger
      </Title>
      <BodyText size="sm" muted className="mb-4">
        Enable console logging categories for this browser tab. In development, categories default
        off except errors and security. PostHog log export runs in production only unless explicitly
        opted in. Production builds keep all categories enabled regardless of these toggles.
      </BodyText>

      <Box className="grid gap-4 md:grid-cols-2">
        <Box className="space-y-3">
          <Title size="sm" as="h3" className="mb-1">
            Categories
          </Title>
          {BOOLEAN_KEYS.map((key) => (
            <Label key={String(key)} size="sm" className="flex items-center gap-2">
              <AccessibleCheckboxInput
                checked={Boolean(frontendConfig[key])}
                disabled={frontendSaving}
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
              disabled={frontendSaving}
              options={LOG_LEVELS.map((lvl) => ({ value: lvl, label: lvl }))}
              value={frontendConfig.logLevel}
              onChange={handleLogLevelChange}
            />
            <BodyText size="xs" muted className="mt-3">
              Checkbox and level changes apply immediately when toggled.
            </BodyText>
          </Box>

          {apiConfig && (
            <Box className="space-y-2">
              <Title size="sm" as="h3" className="mb-1">
                API subcategories
              </Title>
              {(["initialLoad", "polling", "pageMount", "other"] as const).map((k) => (
                <Label key={k} size="sm" className="flex items-center gap-2">
                  <AccessibleCheckboxInput
                    checked={Boolean(apiConfig[k])}
                    disabled={frontendSaving}
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
    </Card>
  );
}
