import { useCallback, useEffect, useState } from "react";

import {
  useDeleteSkySlopeCredential,
  useSaveSkySlopeCredential,
  useSkySlopeCredential,
  useTestSkySlopeConnection,
} from "packages/features/admin/hooks/data/useSkySlopeCredentials";
import { rememberRecentBrokerageId } from "packages/features/admin/utils/integrations/adminSkySlopeRecentBrokerages";
import { log } from "packages/logger";
import { HttpError } from "packages/services/http/client";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import { ConfirmationDialog } from "packages/ui/components/surfaces/modals";
import { dateFormat, dateParseISO } from "packages/utils/core/date";

import Card from "@/components/layout/Card.web";
import { Button, Input } from "@/components/ui";

type SkySlopeCredentialPanelProps = {
  brokerageId: string;
};

type FormState = {
  apiKey: string;
  accessSecret: string;
  skyslopeOrgId: string;
};

const EMPTY_FORM: FormState = {
  apiKey: "",
  accessSecret: "",
  skyslopeOrgId: "",
};

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = dateParseISO(value);
  if (!parsed.isValid()) return value;
  return dateFormat(parsed, "MMM D, YYYY h:mm A");
}

function statusLabel(status: string | undefined): string {
  switch (status) {
    case "active":
      return "Configured — active";
    case "invalid":
      return "Configured — invalid";
    case "pending":
      return "Configured — pending verification";
    default:
      return "Not configured";
  }
}

function resolveErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpError && err.parsedBody && typeof err.parsedBody === "object") {
    const body = err.parsedBody as { error?: string; message?: string };
    if (typeof body.message === "string" && body.message.length > 0) {
      return body.message;
    }
    if (typeof body.error === "string" && body.error.length > 0) {
      return body.error;
    }
  }
  return err instanceof Error ? err.message : fallback;
}

export function SkySlopeCredentialPanel({ brokerageId }: SkySlopeCredentialPanelProps) {
  const {
    data: credential,
    isLoading,
    isFetching,
    error: loadError,
  } = useSkySlopeCredential(brokerageId);
  const saveMutation = useSaveSkySlopeCredential(brokerageId);
  const testMutation = useTestSkySlopeConnection(brokerageId);
  const deleteMutation = useDeleteSkySlopeCredential(brokerageId);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const isConfigured = credential != null;
  const busy =
    isLoading ||
    isFetching ||
    saveMutation.isPending ||
    testMutation.isPending ||
    deleteMutation.isPending;

  useEffect(() => {
    setForm({
      apiKey: "",
      accessSecret: "",
      skyslopeOrgId: credential?.skyslope_org_id ?? "",
    });
    setSaveMessage(null);
    setSaveError(null);
    setTestMessage(null);
    setTestError(null);
  }, [brokerageId, credential?.skyslope_org_id, credential?.updated_at]);

  const handleSave = useCallback(async () => {
    setSaveMessage(null);
    setSaveError(null);

    const apiKey = form.apiKey.trim();
    const accessSecret = form.accessSecret.trim();
    const skyslopeOrgId = form.skyslopeOrgId.trim();

    if (!isConfigured && !apiKey) {
      setSaveError("SkySlope API key is required for a new brokerage connection.");
      return;
    }

    const body = {
      ...(apiKey ? { api_key: apiKey } : {}),
      ...(accessSecret ? { access_secret: accessSecret } : {}),
      skyslope_org_id: skyslopeOrgId.length > 0 ? skyslopeOrgId : null,
    };

    try {
      await saveMutation.mutateAsync({ isConfigured, body });
      rememberRecentBrokerageId(brokerageId);
      setForm((prev) => ({ ...prev, apiKey: "", accessSecret: "" }));
      setSaveMessage(
        isConfigured ? "SkySlope credentials updated." : "SkySlope credentials saved."
      );
      log.security("SECURITY", "SkySlope credentials saved via admin panel", {
        brokerage_id: brokerageId,
        configured: true,
      });
    } catch (err) {
      setSaveError(resolveErrorMessage(err, "Failed to save SkySlope credentials."));
      log.error("ERRORS", "SkySlope credential save failed", err);
    }
  }, [brokerageId, form, isConfigured, saveMutation]);

  const handleTest = useCallback(async () => {
    setTestMessage(null);
    setTestError(null);
    try {
      const result = await testMutation.mutateAsync();
      if (result.success) {
        setTestMessage(result.message ?? "SkySlope connection successful.");
      } else {
        setTestError(result.message ?? "SkySlope connection test failed.");
      }
    } catch (err) {
      setTestError(resolveErrorMessage(err, "SkySlope connection test failed."));
      log.error("ERRORS", "SkySlope connection test failed", err);
    }
  }, [testMutation]);

  const handleRemove = useCallback(async () => {
    setSaveMessage(null);
    setSaveError(null);
    try {
      await deleteMutation.mutateAsync();
      setConfirmRemove(false);
      setForm(EMPTY_FORM);
      setSaveMessage("SkySlope credentials removed.");
      log.security("SECURITY", "SkySlope credentials removed via admin panel", {
        brokerage_id: brokerageId,
      });
    } catch (err) {
      setSaveError(resolveErrorMessage(err, "Failed to remove SkySlope credentials."));
      log.error("ERRORS", "SkySlope credential delete failed", err);
    }
  }, [brokerageId, deleteMutation]);

  return (
    <Card border="light" padding="lg" className="w-full">
      <ConfirmationDialog
        isOpen={confirmRemove}
        title="Remove SkySlope credentials"
        message="This deletes the encrypted SkySlope API key for this brokerage. Historical sync data is not removed."
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={() => {
          void handleRemove();
        }}
        onCancel={() => setConfirmRemove(false)}
      />

      <Title size="lg" as="h2" className="mb-2">
        SkySlope integration
      </Title>
      <BodyText size="sm" muted className="mb-4 max-w-2xl">
        Configure per-brokerage SkySlope AccessKey and AccessSecret. Secrets are encrypted
        server-side and never returned after save.
      </BodyText>

      <Box className="border-border bg-muted/30 mb-6 rounded-md border p-4">
        <BodyText size="sm" className="font-medium">
          {statusLabel(credential?.status)}
        </BodyText>
        {isConfigured ? (
          <Box className="mt-2 grid gap-1 sm:grid-cols-2">
            <BodyText size="xs" muted>
              Key ending in: {credential.key_last4 ? `••••${credential.key_last4}` : "—"}
            </BodyText>
            <BodyText size="xs" muted>
              Last verified: {formatTimestamp(credential.last_verified_at)}
            </BodyText>
            <BodyText size="xs" muted>
              Updated: {formatTimestamp(credential.updated_at)}
            </BodyText>
            <BodyText size="xs" muted>
              SkySlope org ID: {credential.skyslope_org_id ?? "—"}
            </BodyText>
          </Box>
        ) : (
          <BodyText size="xs" muted className="mt-2">
            No SkySlope credentials stored for this brokerage yet.
          </BodyText>
        )}
        {loadError ? (
          <BodyText size="xs" className="text-destructive mt-2" role="alert">
            {resolveErrorMessage(loadError, "Failed to load credential status.")}
          </BodyText>
        ) : null}
      </Box>

      <Box className="flex max-w-xl flex-col gap-4">
        <Input
          label="SkySlope API key (AccessKey)"
          type="password"
          placeholder={isConfigured ? "Enter new key to rotate" : "Required"}
          value={form.apiKey}
          onChange={(e) => setForm((prev) => ({ ...prev, apiKey: e.target.value }))}
          disabled={busy}
          autoComplete="off"
        />
        <Input
          label="SkySlope access secret"
          type="password"
          placeholder={isConfigured ? "Enter new secret to rotate" : "Required for live API calls"}
          value={form.accessSecret}
          onChange={(e) => setForm((prev) => ({ ...prev, accessSecret: e.target.value }))}
          disabled={busy}
          autoComplete="off"
        />
        <Input
          label="SkySlope org ID (optional)"
          placeholder="SkySlope organization identifier"
          value={form.skyslopeOrgId}
          onChange={(e) => setForm((prev) => ({ ...prev, skyslopeOrgId: e.target.value }))}
          disabled={busy}
          autoComplete="off"
        />

        <Box className="flex flex-wrap gap-2">
          <Button variant="primary" size="md" disabled={busy} onClick={() => void handleSave()}>
            {saveMutation.isPending ? "Saving…" : "Save"}
          </Button>
          <Button
            variant="secondary"
            size="md"
            disabled={busy || !isConfigured}
            onClick={() => void handleTest()}
          >
            {testMutation.isPending ? "Testing…" : "Test connection"}
          </Button>
          {isConfigured ? (
            <Button
              variant="danger"
              size="md"
              disabled={busy}
              onClick={() => setConfirmRemove(true)}
            >
              Remove
            </Button>
          ) : null}
        </Box>

        {saveMessage ? (
          <BodyText size="sm" className="text-brand-secondary" role="status">
            {saveMessage}
          </BodyText>
        ) : null}
        {saveError ? (
          <BodyText size="sm" className="text-destructive" role="alert">
            {saveError}
          </BodyText>
        ) : null}
        {testMessage ? (
          <BodyText size="sm" className="text-brand-secondary" role="status">
            {testMessage}
          </BodyText>
        ) : null}
        {testError ? (
          <BodyText size="sm" className="text-destructive" role="alert">
            {testError}
          </BodyText>
        ) : null}

        {!isConfigured ? (
          <BodyText size="xs" muted>
            Saving new credentials enqueues a full SkySlope transaction sync for this brokerage.
          </BodyText>
        ) : null}
      </Box>
    </Card>
  );
}
