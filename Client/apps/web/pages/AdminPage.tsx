import { useEffect, useMemo, useState } from "react";

import {
  AdminDeleteUserSection,
  AdminDocuSignDiagnosticsSection,
} from "packages/features/admin";
import { useStepUpAuth } from "packages/hooks/ui";
import { log, LOG_CATEGORIES, type LoggerConfig } from "packages/logger";
import { useAuthStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";

import { AuthGuard } from "@/app/guards";
import { AdminGuard } from "@/app/guards/auth";
import Card from "@/components/layout/Card.web";
import {
  AccessibleCheckboxInput,
  BodyText,
  Button,
  Label,
  Select,
  Title,
} from "@/components/ui";

type FrontendLoggerConfigState = LoggerConfig;

type BooleanConfigKey = Exclude<
  keyof FrontendLoggerConfigState,
  "logLevel" | "api" | string
>;

const BOOLEAN_KEYS: BooleanConfigKey[] = [
  "polling",
  "pages",
  "hooks",
  "auth",
  "http",
  "errors",
  "security",
];

const LOG_LEVELS: FrontendLoggerConfigState["logLevel"][] = [
  "DEBUG",
  "INFO",
  "WARN",
  "ERROR",
];

export default function AdminPage() {
  const { isStepUpRequired, requestStepUpAuth, stepUpModalProps } =
    useStepUpAuth();
  const [stepUpSatisfied, setStepUpSatisfied] = useState(false);

  const [frontendConfig, setFrontendConfig] =
    useState<FrontendLoggerConfigState | null>(null);
  const [frontendSaving, setFrontendSaving] = useState(false);

  const isAgent = useAuthStore((s) => s.user?.is_agent ?? false);

  useEffect(() => {
    let mounted = true;

    const ensureStepUp = async () => {
      if (!isStepUpRequired("access_admin_panel")) {
        if (mounted) setStepUpSatisfied(true);
        return;
      }

      const ok = await requestStepUpAuth(
        "access_admin_panel",
        "Confirm your identity to access the SilverKey admin logger console.",
      );

      if (mounted) setStepUpSatisfied(ok);
    };

    void ensureStepUp();

    return () => {
      mounted = false;
    };
  }, [isStepUpRequired, requestStepUpAuth]);

  useEffect(() => {
    if (!stepUpSatisfied) return;

    try {
      const config = log.getConfig();
      setFrontendConfig(config);
    } catch (error) {
      log.error(
        LOG_CATEGORIES.ERRORS,
        "[ADMIN_PAGE] Failed to read frontend logger config",
        error,
      );
    }
  }, [stepUpSatisfied]);

  const apiConfig =
    frontendConfig && typeof frontendConfig.api === "object"
      ? frontendConfig.api
      : undefined;

  const handleToggleBoolean = (key: BooleanConfigKey) => {
    setFrontendConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const handleApiToggle = (
    key: keyof NonNullable<FrontendLoggerConfigState["api"]>,
  ) => {
    setFrontendConfig((prev) => {
      if (!prev || !apiConfig) return prev;
      return {
        ...prev,
        api: {
          ...apiConfig,
          [key]: !apiConfig[key],
        },
      };
    });
  };

  const handleLogLevelChange = (
    value: FrontendLoggerConfigState["logLevel"],
  ) => {
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

      if (
        typeof frontendConfig.api === "object" &&
        typeof current.api === "object"
      ) {
        const apiChanges: Record<string, boolean> = {};
        (["initialLoad", "polling", "pageMount", "other"] as const).forEach(
          (k) => {
            if (
              frontendConfig.api &&
              current.api &&
              frontendConfig.api[k] !== current.api[k]
            ) {
              apiChanges[k] = frontendConfig.api[k];
            }
          },
        );
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
      log.security(
        LOG_CATEGORIES.SECURITY,
        "[ADMIN_PAGE] Updated frontend logger config",
        {
          fields: Object.keys(diff),
        },
      );
      const updated = log.getConfig();
      setFrontendConfig(updated);
    } catch (error) {
      log.error(
        LOG_CATEGORIES.ERRORS,
        "[ADMIN_PAGE] Failed to update frontend logger config",
        error,
      );
    } finally {
      setFrontendSaving(false);
    }
  };

  const renderStepUpModal = () => {
    if (!stepUpModalProps.isOpen) return null;

    return (
      <Box className="fixed inset-0 z-modal flex items-center justify-center bg-overlay-backdrop p-4">
        <Card border="light" className="w-full max-w-md" padding="lg">
          <Title size="lg" as="h2" className="mb-2">
            Confirm your identity
          </Title>
          <BodyText size="sm" muted className="mb-4">
            {stepUpModalProps.description ??
              "For your security, please confirm your identity to access this admin feature."}
          </BodyText>
          <Box className="mt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={stepUpModalProps.onClose}
              disabled={frontendSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={stepUpModalProps.onSuccess}
              disabled={frontendSaving}
            >
              Continue
            </Button>
          </Box>
        </Card>
      </Box>
    );
  };

  const content =
    !stepUpSatisfied || !frontendConfig ? (
      <Box className="flex min-h-[60vh] items-center justify-center">
        <BodyText size="sm" muted>
          Preparing admin logger console…
        </BodyText>
      </Box>
    ) : (
      <Box className="flex flex-col gap-6">
        <Card border="light" padding="lg" className="w-full">
          <Title size="lg" as="h1" className="mb-2">
            Admin Logger Console
          </Title>
          <BodyText size="sm" muted className="mb-4">
            Adjust frontend logging behavior at runtime. Changes apply
            immediately for your session and other open tabs.
          </BodyText>

          <Box className="grid gap-4 md:grid-cols-2">
            <Box className="space-y-3">
              <Title size="sm" as="h2" className="mb-1">
                Categories
              </Title>
              {BOOLEAN_KEYS.map((key) => (
                <Label key={key} size="sm" className="flex items-center gap-2">
                  <AccessibleCheckboxInput
                    checked={Boolean(frontendConfig[key])}
                    className="h-4 w-4 rounded border-border accent-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-0"
                    label={`Toggle ${key}`}
                    onChange={() => handleToggleBoolean(key)}
                  />
                  <BodyText as="span" size="sm" className="capitalize">
                    {key}
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
                    handleLogLevelChange(
                      value as FrontendLoggerConfigState["logLevel"],
                    )
                  }
                />
              </Box>

              {apiConfig && (
                <Box className="space-y-2">
                  <Title size="sm" as="h2" className="mb-1">
                    API subcategories
                  </Title>
                  {(
                    ["initialLoad", "polling", "pageMount", "other"] as const
                  ).map((k) => (
                    <Label
                      key={k}
                      size="sm"
                      className="flex items-center gap-2"
                    >
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

          <Box className="mt-6 flex items-center justify-between gap-4">
            <BodyText size="xs" muted>
              Changes are applied only to the frontend logger. Backend logger
              config is managed separately.
            </BodyText>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApplyFrontendConfig}
              disabled={!diff || frontendSaving}
            >
              Apply frontend logger settings
            </Button>
          </Box>
        </Card>

        <Card border="light" padding="lg" className="w-full border-border">
          <AdminDeleteUserSection />
        </Card>

        <Card border="light" padding="lg" className="w-full">
          <AdminDocuSignDiagnosticsSection isAgent={isAgent} />
        </Card>
      </Box>
    );

  return (
    <AuthGuard>
      <AdminGuard>
        <Box className="mx-auto max-w-5xl p-4 md:p-8">
          {content}
          {renderStepUpModal()}
        </Box>
      </AdminGuard>
    </AuthGuard>
  );
}
