import { useCallback, useEffect, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useLocalization } from "packages/contexts";
import { spacing } from "packages/design-tokens";
import { checklistDispatchAutomationApi } from "packages/features/checklists/api/checklistDispatchAutomation";
import type { ChecklistType } from "packages/features/checklists/api/checklists";
import {
  useChecklistDispatchAutomationQuery,
  useChecklistDispatchAutomationSave,
} from "packages/features/checklists/hooks/data/useChecklistDispatchAutomation";
import { showErrorToast, showSuccessToast } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { components } from "packages/types/api.generated";
import { AccessibleCheckboxInput, AccessibleRadioInput, Button, Textarea } from "packages/ui";
import BaseModal from "packages/ui/components/modals/BaseModal";
import { Box, Text } from "packages/ui/components/primitives";
import Label from "packages/ui/components/text/Label";

type ChecklistDispatchChannel = components["schemas"]["ChecklistDispatchChannel"];
type ChecklistDispatchRecipientScope = components["schemas"]["ChecklistDispatchRecipientScope"];
type ChecklistDispatchNoteMode = components["schemas"]["ChecklistDispatchNoteMode"];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  hubClientUserId: string;
  checklistCategory: ChecklistType;
  itemId: number;
  itemLabel: string;
};

export default function ChecklistDispatchAutomationModal({
  isOpen,
  onClose,
  hubClientUserId,
  checklistCategory,
  itemId,
  itemLabel,
}: Props) {
  const { t } = useLocalization();
  const { data: setting, isLoading } = useChecklistDispatchAutomationQuery(
    hubClientUserId,
    checklistCategory,
    itemId,
    isOpen
  );
  const save = useChecklistDispatchAutomationSave(hubClientUserId, checklistCategory, itemId);

  const { data: clientsResponse } = useQuery({
    queryKey: ["agent-clients", "dispatch-automation-modal"],
    queryFn: () => checklistDispatchAutomationApi.getAgentClients(),
    enabled: isOpen,
    staleTime: 60_000,
  });

  const clients = useMemo(() => clientsResponse?.clients ?? [], [clientsResponse]);

  const [enabled, setEnabled] = useState(false);
  const [channel, setChannel] = useState<ChecklistDispatchChannel>("messaging");
  const [recipientScope, setRecipientScope] =
    useState<ChecklistDispatchRecipientScope>("context_client");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [noteMode, setNoteMode] = useState<ChecklistDispatchNoteMode>("none");
  const [noteBroadcast, setNoteBroadcast] = useState("");
  const [notesPerClient, setNotesPerClient] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!setting) return;
    setEnabled(setting.enabled);
    setChannel(setting.channel);
    setRecipientScope(setting.recipientScope);
    setSelectedIds(setting.selectedClientIds ?? []);
    setNoteMode(setting.noteMode);
    setNoteBroadcast(setting.noteBroadcast ?? "");
    setNotesPerClient(setting.notesPerClient ?? {});
  }, [setting]);

  const toggleClientSelected = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const clientRows = useMemo(
    () =>
      clients.map((c) => ({
        id: c.id,
        label: [c.name, c.email].filter(Boolean).join(" · ") || c.id,
      })),
    [clients]
  );

  const noteRecipientIds = useMemo(() => {
    if (recipientScope === "context_client") return [hubClientUserId];
    if (recipientScope === "all_agent_clients") return clientRows.map((r) => r.id);
    return selectedIds;
  }, [clientRows, hubClientUserId, recipientScope, selectedIds]);

  const handleSave = useCallback(async () => {
    try {
      await save.mutateAsync({
        enabled,
        channel,
        recipientScope,
        selectedClientIds: recipientScope === "selected_clients" ? selectedIds : null,
        noteMode,
        noteBroadcast: noteBroadcast.trim() || null,
        notesPerClient:
          noteMode === "per_client" && Object.keys(notesPerClient).length > 0
            ? notesPerClient
            : null,
      });
      showSuccessToast(
        t("checklists.dispatch_automation.saved", {
          defaultValue: "Automation settings saved.",
        })
      );
      onClose();
    } catch (e) {
      log.error(LOG_CATEGORIES.ERRORS, "dispatch_automation_save_failed", e);
      showErrorToast(
        t("checklists.dispatch_automation.save_error", {
          defaultValue: "Could not save settings. Try again.",
        })
      );
    }
  }, [
    channel,
    enabled,
    noteBroadcast,
    noteMode,
    notesPerClient,
    onClose,
    recipientScope,
    save,
    selectedIds,
    t,
  ]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("checklists.dispatch_automation.title", {
        defaultValue: "Step automation",
      })}
      size="lg"
      footerContent={
        <Box className="flex flex-row justify-end gap-2">
          <Button variant="secondary" size="md" onPress={onClose}>
            {t("checklists.dispatch_automation.cancel", {
              defaultValue: "Cancel",
            })}
          </Button>
          <Button
            variant="primary"
            size="md"
            onPress={() => void handleSave()}
            disabled={save.isPending || isLoading}
          >
            {t("checklists.dispatch_automation.save", {
              defaultValue: "Save",
            })}
          </Button>
        </Box>
      }
    >
      <Box className="flex flex-col gap-4">
        <Text className="text-text-secondary text-sm">{itemLabel}</Text>
        {isLoading ? (
          <Text className="text-text-muted text-sm">
            {t("checklists.loading", { defaultValue: "Loading..." })}
          </Text>
        ) : null}

        <Label className="flex flex-row items-center gap-2">
          <AccessibleCheckboxInput
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <Text className="text-text-primary text-sm">
            {t("checklists.dispatch_automation.enable", {
              defaultValue: "Automatically send forms when this client checks off this step",
            })}
          </Text>
        </Label>

        <Box className="flex flex-col gap-1">
          <Text className="text-text-primary text-sm font-medium">
            {t("checklists.dispatch_automation.channel", {
              defaultValue: "Delivery",
            })}
          </Text>
          {(["messaging", "docusign", "both"] as ChecklistDispatchChannel[]).map((c) => (
            <Label key={c} className="flex flex-row items-center gap-2">
              <AccessibleRadioInput
                name="dispatch-channel"
                checked={channel === c}
                onChange={() => setChannel(c)}
              />
              <Text className="text-text-primary text-sm capitalize">{c}</Text>
            </Label>
          ))}
        </Box>

        <Box className="flex flex-col gap-1">
          <Text className="text-text-primary text-sm font-medium">
            {t("checklists.dispatch_automation.recipients", {
              defaultValue: "Recipients",
            })}
          </Text>
          {(
            [
              "context_client",
              "all_agent_clients",
              "selected_clients",
            ] as ChecklistDispatchRecipientScope[]
          ).map((s) => (
            <Label key={s} className="flex flex-row items-center gap-2">
              <AccessibleRadioInput
                name="dispatch-recipients"
                checked={recipientScope === s}
                onChange={() => setRecipientScope(s)}
              />
              <Text className="text-text-primary text-sm">
                {s === "context_client"
                  ? t("checklists.dispatch_automation.recipient_context", {
                      defaultValue: "Only this client (the one who checked)",
                    })
                  : s === "all_agent_clients"
                    ? t("checklists.dispatch_automation.recipient_all", {
                        defaultValue: "All of my clients",
                      })
                    : t("checklists.dispatch_automation.recipient_selected", {
                        defaultValue: "Selected clients",
                      })}
              </Text>
            </Label>
          ))}
        </Box>

        {recipientScope === "selected_clients" ? (
          <Box className="border-border max-h-48 overflow-y-auto rounded border p-2">
            {clientRows.length === 0 ? (
              <Text className="text-text-muted text-xs">No clients found.</Text>
            ) : (
              clientRows.map((row) => (
                <Label key={row.id} className="flex flex-row items-center gap-2 py-1">
                  <AccessibleCheckboxInput
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggleClientSelected(row.id)}
                  />
                  <Text className="text-text-primary text-sm">{row.label}</Text>
                </Label>
              ))
            )}
          </Box>
        ) : null}

        <Box className="flex flex-col gap-1">
          <Text className="text-text-primary text-sm font-medium">
            {t("checklists.dispatch_automation.notes", {
              defaultValue: "Optional message",
            })}
          </Text>
          {(["none", "broadcast", "per_client"] as ChecklistDispatchNoteMode[]).map((m) => (
            <Label key={m} className="flex flex-row items-center gap-2">
              <AccessibleRadioInput
                name="dispatch-notes"
                checked={noteMode === m}
                onChange={() => setNoteMode(m)}
              />
              <Text className="text-text-primary text-sm capitalize">{m.replace("_", " ")}</Text>
            </Label>
          ))}
        </Box>

        {noteMode === "broadcast" ? (
          <Textarea
            className="border-border text-text-primary rounded border p-2 text-sm"
            style={{ minHeight: spacing(22) }}
            value={noteBroadcast}
            onChange={(e) => setNoteBroadcast(e.target.value)}
            placeholder={t("checklists.dispatch_automation.note_placeholder", {
              defaultValue: "Message included for each recipient…",
            })}
          />
        ) : null}

        {noteMode === "per_client" ? (
          <Box className="max-h-56 space-y-2 overflow-y-auto">
            {noteRecipientIds.length === 0 ? (
              <Text className="text-text-muted text-xs">
                {t("checklists.dispatch_automation.no_recipients_notes", {
                  defaultValue: "Choose recipients above to add per-client notes.",
                })}
              </Text>
            ) : (
              noteRecipientIds.map((cid) => {
                const label = clientRows.find((r) => r.id === cid)?.label ?? cid;
                return (
                  <Box key={cid} className="flex flex-col gap-1">
                    <Text className="text-text-secondary text-xs">{label}</Text>
                    <Textarea
                      className="border-border text-text-primary rounded border p-2 text-sm"
                      style={{ minHeight: spacing(16) }}
                      value={notesPerClient[cid] ?? ""}
                      onChange={(e) =>
                        setNotesPerClient((prev) => ({
                          ...prev,
                          [cid]: e.target.value,
                        }))
                      }
                    />
                  </Box>
                );
              })
            )}
          </Box>
        ) : null}
      </Box>
    </BaseModal>
  );
}
