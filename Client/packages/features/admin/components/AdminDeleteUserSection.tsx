import { useCallback, useState } from "react";

import { adminApi } from "packages/api/admin";
import { log, LOG_CATEGORIES } from "packages/logger";
import { HttpError } from "packages/services/http/client";
import { Box } from "packages/ui/components/primitives";

import {
  AccessibleCheckboxInput,
  BodyText,
  Button,
  Input,
  Label,
  Title,
} from "@/components/ui";

export function AdminDeleteUserSection() {
  const [deleteUserIdInput, setDeleteUserIdInput] = useState("");
  const [deleteUserAcknowledged, setDeleteUserAcknowledged] = useState(false);
  const [deleteUserBusy, setDeleteUserBusy] = useState(false);
  const [deleteUserError, setDeleteUserError] = useState<string | null>(null);
  const [deleteUserSuccess, setDeleteUserSuccess] = useState<string | null>(null);

  const handleDeleteUser = useCallback(async () => {
    const trimmed = deleteUserIdInput.trim();
    setDeleteUserError(null);
    setDeleteUserSuccess(null);
    if (!trimmed) {
      setDeleteUserError("Enter a user id.");
      return;
    }
    if (!deleteUserAcknowledged) {
      setDeleteUserError("Confirm that you understand this action is permanent.");
      return;
    }
    setDeleteUserBusy(true);
    try {
      const { deleted_user_id: deletedId } = await adminApi.deleteUserById(trimmed);
      setDeleteUserSuccess(`Deleted user ${deletedId} and related data.`);
      setDeleteUserIdInput("");
      setDeleteUserAcknowledged(false);
      log.security(LOG_CATEGORIES.SECURITY, "[ADMIN] Deleted user via admin API", {
        deleted_user_id: deletedId,
      });
    } catch (err) {
      let message = err instanceof Error ? err.message : "Failed to delete user";
      if (err instanceof HttpError && err.parsedBody && typeof err.parsedBody === "object") {
        const body = err.parsedBody as { error?: string };
        if (typeof body.error === "string" && body.error.length > 0) {
          message = body.error;
        }
      }
      setDeleteUserError(message);
      log.error(LOG_CATEGORIES.ERRORS, "[ADMIN] deleteUserById failed", err);
    } finally {
      setDeleteUserBusy(false);
    }
  }, [deleteUserAcknowledged, deleteUserIdInput]);

  return (
    <>
      <Title size="lg" as="h2" className="mb-2">
        Delete user (database)
      </Title>
      <BodyText size="sm" muted className="mb-4">
        Permanently removes the user row and related application data (documents, agreements where they
        are a party, transactions, messages, etc.). This cannot be undone. You cannot delete your own
        account here.
      </BodyText>
      <Box className="flex max-w-xl flex-col gap-4">
        <Input
          label="User ID"
          placeholder="users.id (UUID)"
          value={deleteUserIdInput}
          onChange={(e) => setDeleteUserIdInput(e.target.value)}
          disabled={deleteUserBusy}
          autoComplete="off"
        />
        <Label size="sm" className="flex items-start gap-2">
          <AccessibleCheckboxInput
            checked={deleteUserAcknowledged}
            className="mt-0.5 h-4 w-4 shrink-0"
            label="Acknowledge permanent deletion"
            onChange={() => setDeleteUserAcknowledged((v) => !v)}
            disabled={deleteUserBusy}
          />
          <BodyText as="span" size="sm">
            I understand this permanently deletes the user and related records.
          </BodyText>
        </Label>
        <Button
          variant="danger"
          size="sm"
          className="self-start"
          onClick={() => void handleDeleteUser()}
          disabled={deleteUserBusy || !deleteUserIdInput.trim() || !deleteUserAcknowledged}
        >
          {deleteUserBusy ? "Deleting…" : "Delete user"}
        </Button>
        {deleteUserError && (
          <BodyText size="sm" className="text-red-600">
            {deleteUserError}
          </BodyText>
        )}
        {deleteUserSuccess && (
          <BodyText size="sm" className="text-green-600">
            {deleteUserSuccess}
          </BodyText>
        )}
      </Box>
    </>
  );
}
