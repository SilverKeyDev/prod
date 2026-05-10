import { useMemo, useState } from "react";

import { log, LOG_CATEGORIES, type LoggerConfig } from "packages/logger";
import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { AccessibleCheckboxInput, BodyText, Button, Label, Select, Title } from "@/components/ui";

type FrontendLoggerConfigState = LoggerConfig;

type BooleanConfigKey = Exclude<keyof FrontendLoggerConfigState, "logLevel" | "api" | string>;

const BOOLEAN_KEYS: BooleanConfigKey[] = [
  "polling",
  "pages",
  "hooks",
  "auth",
  "http",
  "errors",
  "security",
];

const LOG_LEVELS: FrontendLoggerConfigState["logLevel"][] = ["DEBUG", "INFO", "WARN", "ERROR"];

export function AdminFrontendLoggerSection() {
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

  const handleToggleBoolean = (key: BooleanConfigKey) => {
    setFrontendConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const handleApiToggle = (key: keyof NonNullable<FrontendLoggerConfigState["api"]>) => {
    setFrontendConfig((prev) => {
      if (!prev || !prev.api || typeof prev.api !== "object") return prev;
      const nextApi = prev.api as NonNullable<FrontendLoggerConfigState["api"]>;
      return {
        ...prev,
        api: {
          ...nextApi,
          [key]: !nextApi[key],
        },
      };
    });
  };

  const handleLogLevelChange = (value: FrontendLoggerConfigState["logLevel"]) => {
    setFrontendConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, logLevel: value };
    });
  };

  const diff = useMemo(() => {
    if (!frontendConfig) return null;
    try {
      const current = log.getConfig();
      const changed: Partial<FrontendLoggerConfigState> = {};

      BOOLEAN_KEYS.forEach((key) => {
        if (frontendConfig[key] !== current[key]) {
          changed[key] = frontendConfig[key];
        }
      });

      if (typeof frontendConfig.api === "object" && typeof current.api === "object") {
        const apiChanges: Record<string, boolean> = {};
        (["initialLoad", "polling", "pageMount", "other"] as const).forEach((k) => {
          if (frontendConfig.api && current.api && frontendConfig.api[k] !== current.api[k]) {
            apiChanges[k] = frontendConfig.api[k];
          }
        });
        if (Object.keys(apiChanges).length > 0) {
          changed.api = {
            ...(current.api as NonNullable<FrontendLoggerConfigState["api"]>),
            ...apiChanges,
          };
        }
      }

      if (frontendConfig.logLevel !== current.logLevel) {
        changed.logLevel = frontendConfig.logLevel;
      }

      return Object.keys(changed).length > 0 ? changed : null;
    } catch {
      return null;
    }
  }, [frontendConfig]);

  const handleApplyFrontendConfig = () => {
    if (!frontendConfig || !diff) return;
    setFrontendSaving(true);
    try {
      log.updateConfig(diff);
      log.security(LOG_CATEGORIES.SECURITY, "[ADMIN_PAGE] Updated frontend logger config", {
        fields: Object.keys(diff),
      });
      const updated = log.getConfig();
      setFrontendConfig(updated);
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

  if (!frontendConfig) {
    return (
      <Card border="light" padding="lg" className="w-full">
        <BodyText size="sm" muted>Unable to read frontend logger config.</BodyText>
      </Card>
    );
  }

  return (
    <Card border="light" padding="lg" className="w-full">
      <Title size="lg" as="h2" className="mb-2">
        Frontend logger
      </Title>
      <BodyText size="sm" muted className="mb-4">
        Adjust browser logging categories at runtime for this tab and session peers.
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
                className="h-4 w-4 rounded border-border accent-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-0"
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
            <Select
              className="mt-1"
              options={LOG_LEVELS.map((lvl) => ({
                value: lvl,
                label: lvl,
              }))}
              value={frontendConfig.logLevel}
              onChange={(value) =>
                handleLogLevelChange(value as FrontendLoggerConfigState["logLevel"])
              }
            />
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
                    className="h-4 w-4 rounded border-border accent-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-0"
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

      <Box className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BodyText size="xs" muted>
          Backend logger settings live in the server logger card below.
        </BodyText>
        <Button
          variant="primary"
          size="sm"
          onClick={handleApplyFrontendConfig}
          disabled={!diff || frontendSaving}
          iconName="settings"
        >
          Apply frontend logger settings
        </Button>
      </Box>
    </Card>
  );
}
