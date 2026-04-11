import { useCallback, useState } from "react";

import { adminApi } from "packages/api/admin";
import { log, LOG_CATEGORIES } from "packages/logger";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Button, Title } from "@/components/ui";

type AdminDocuSignDiagnosticsSectionProps = {
  isAgent: boolean;
};

export function AdminDocuSignDiagnosticsSection({
  isAgent,
}: AdminDocuSignDiagnosticsSectionProps) {
  const [docusignAuthUrl, setDocusignAuthUrl] = useState<string | null>(null);
  const [docusignOAuthLoading, setDocusignOAuthLoading] = useState(false);
  const [docusignOAuthError, setDocusignOAuthError] = useState<string | null>(
    null,
  );
  const [docusignTemplatesLoading, setDocusignTemplatesLoading] =
    useState(false);
  const [docusignTemplatesError, setDocusignTemplatesError] = useState<
    string | null
  >(null);
  const [docusignTemplatesPreview, setDocusignTemplatesPreview] = useState<
    string | null
  >(null);
  const [docusignSyncLoading, setDocusignSyncLoading] = useState(false);
  const [docusignSyncError, setDocusignSyncError] = useState<string | null>(
    null,
  );
  const [docusignSyncTaskId, setDocusignSyncTaskId] = useState<string | null>(
    null,
  );

  const handleDocusignOAuthStart = useCallback(async () => {
    setDocusignOAuthError(null);
    setDocusignAuthUrl(null);
    setDocusignOAuthLoading(true);
    try {
      const { auth_url: authUrl } = await adminApi.docusignOAuthStart();
      setDocusignAuthUrl(authUrl);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "DocuSign OAuth start failed";
      setDocusignOAuthError(message);
      log.error(
        LOG_CATEGORIES.ERRORS,
        "[ADMIN_PAGE] docusignOAuthStart failed",
        err,
      );
    } finally {
      setDocusignOAuthLoading(false);
    }
  }, []);

  const handleDocusignListTemplates = useCallback(async () => {
    setDocusignTemplatesError(null);
    setDocusignTemplatesPreview(null);
    setDocusignTemplatesLoading(true);
    try {
      const templates = await adminApi.docusignListTemplates();
      setDocusignTemplatesPreview(JSON.stringify(templates, null, 2));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to list templates";
      setDocusignTemplatesError(message);
      log.error(
        LOG_CATEGORIES.ERRORS,
        "[ADMIN_PAGE] docusignListTemplates failed",
        err,
      );
    } finally {
      setDocusignTemplatesLoading(false);
    }
  }, []);

  const handleDocusignSyncTemplates = useCallback(async () => {
    setDocusignSyncError(null);
    setDocusignSyncTaskId(null);
    setDocusignSyncLoading(true);
    try {
      const { task_id: taskId } = await adminApi.docusignSyncTemplates();
      setDocusignSyncTaskId(taskId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Template sync failed";
      setDocusignSyncError(message);
      log.error(
        LOG_CATEGORIES.ERRORS,
        "[ADMIN_PAGE] docusignSyncTemplates failed",
        err,
      );
    } finally {
      setDocusignSyncLoading(false);
    }
  }, []);

  return (
    <>
      <Title size="lg" as="h2" className="mb-2">
        DocuSign integration (agent)
      </Title>
      <BodyText size="sm" muted className="mb-4">
        These actions call <code className="text-xs">/api/v1/docusign/*</code>{" "}
        and require an account with agent access. Configure{" "}
        <code className="text-xs">DOCUSIGN_CLIENT_ID</code>,{" "}
        <code className="text-xs">DOCUSIGN_CLIENT_SECRET</code>, and related
        keys in Server <code className="text-xs">.env</code>. Template sync
        returns a Celery task id; a worker must be running to process it.
      </BodyText>
      {!isAgent ? (
        <BodyText size="sm" className="text-amber-700">
          Turn on &quot;Agent&quot; above to use DocuSign diagnostics from this
          page.
        </BodyText>
      ) : (
        <Box className="flex flex-col gap-4">
          <Box className="flex flex-col gap-2">
            <Title size="sm" as="h3">
              OAuth
            </Title>
            <Button
              variant="primary"
              size="sm"
              disabled={docusignOAuthLoading}
              onClick={() => {
                void handleDocusignOAuthStart();
              }}
            >
              {docusignOAuthLoading
                ? "Loading…"
                : "Start DocuSign OAuth (get auth URL)"}
            </Button>
            {docusignOAuthError ? (
              <BodyText size="sm" className="text-red-600">
                {docusignOAuthError}
              </BodyText>
            ) : null}
            {docusignAuthUrl ? (
              <BodyText size="xs" className="break-all font-mono">
                {docusignAuthUrl}
              </BodyText>
            ) : null}
          </Box>
          <Box className="flex flex-col gap-2">
            <Title size="sm" as="h3">
              Templates
            </Title>
            <Box className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={docusignTemplatesLoading}
                onClick={() => {
                  void handleDocusignListTemplates();
                }}
              >
                {docusignTemplatesLoading ? "Loading…" : "List templates"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={docusignSyncLoading}
                onClick={() => {
                  void handleDocusignSyncTemplates();
                }}
              >
                {docusignSyncLoading ? "Queueing…" : "Queue template sync"}
              </Button>
            </Box>
            {docusignTemplatesError ? (
              <BodyText size="sm" className="text-red-600">
                {docusignTemplatesError}
              </BodyText>
            ) : null}
            {docusignSyncError ? (
              <BodyText size="sm" className="text-red-600">
                {docusignSyncError}
              </BodyText>
            ) : null}
            {docusignSyncTaskId ? (
              <BodyText size="xs" className="font-mono">
                task_id: {docusignSyncTaskId}
              </BodyText>
            ) : null}
            {docusignTemplatesPreview ? (
              <Box className="max-h-64 overflow-auto rounded-md border border-gray-200 bg-gray-50 p-3">
                <BodyText
                  size="xs"
                  className="whitespace-pre-wrap break-all font-mono"
                >
                  {docusignTemplatesPreview}
                </BodyText>
              </Box>
            ) : null}
          </Box>
        </Box>
      )}
    </>
  );
}
