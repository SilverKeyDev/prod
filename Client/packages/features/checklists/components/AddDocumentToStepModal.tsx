import { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "@ui/icons";

import { linkDocumentToChecklistItem } from "packages/api";
import { useLocalization } from "packages/contexts";
import {
  getTaskChecklist,
  type TaskChecklistItem,
} from "packages/features/checklists/api/checklists";
import { useDocuments } from "packages/features/documents";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useUIStore } from "packages/store";
import Button from "packages/ui/components/button/Button";
import { BaseModal } from "packages/ui/components/modals";
import { Box, Text, TouchableBox } from "packages/ui/components/primitives";
import { Platform } from "packages/utils/platform";

import type { ChecklistTab } from "../types/checklists";
import { CHECKLIST_TITLES } from "../types/checklists";

const PROCESS_TABS: ChecklistTab[] = [
  "search",
  "offer",
  "escrow",
  "inspections",
  "financing",
  "closing",
];

const TAB_TO_CHECKLIST_TYPE: Record<
  ChecklistTab,
  "search" | "offer" | "escrow" | "financing" | "closing" | "insurance"
> = {
  search: "search",
  offer: "offer",
  escrow: "escrow",
  inspections: "insurance",
  financing: "financing",
  closing: "closing",
};

type AddDocumentToStepModalProps = {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  onSuccess?: () => void;
};

type PickerAsset = { uri: string; name?: string; mimeType?: string; size?: number };

export default function AddDocumentToStepModal({
  isOpen,
  onClose,
  transactionId,
  onSuccess,
}: AddDocumentToStepModalProps) {
  const { t } = useLocalization();
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const { uploadDocument } = useDocuments();
  const [selectedProcess, setSelectedProcess] = useState<ChecklistTab | null>(null);
  const [selectedStep, setSelectedStep] = useState<TaskChecklistItem | null>(null);
  const [steps, setSteps] = useState<TaskChecklistItem[]>([]);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | PickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchSteps = useCallback(async (tab: ChecklistTab) => {
    setStepsLoading(true);
    setError(null);
    try {
      const type = TAB_TO_CHECKLIST_TYPE[tab];
      const data = await getTaskChecklist(type);
      setSteps(data.items ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load steps";
      setError(msg);
      setSteps([]);
      log.warn(LOG_CATEGORIES.API, "AddDocumentToStepModal: fetch steps failed", { error: msg });
    } finally {
      setStepsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && selectedProcess) {
      void fetchSteps(selectedProcess);
    } else {
      setSteps([]);
      setSelectedStep(null);
    }
  }, [isOpen, selectedProcess, fetchSteps]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedProcess(null);
      setSelectedStep(null);
      setSelectedFile(null);
      setError(null);
    }
  }, [isOpen]);

  const handleProcessSelect = useCallback((tab: ChecklistTab) => {
    setSelectedProcess(tab);
    setSelectedStep(null);
  }, []);

  const handleStepSelect = useCallback((item: TaskChecklistItem) => {
    setSelectedStep(item);
  }, []);

  const handleFileSelectWeb = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  }, []);

  const handleFileSelectNative = useCallback(async () => {
    try {
      const DocumentPicker = await import("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: ["application/pdf", "image/*"],
      });
      if (!result.canceled) {
        setSelectedFile(result.assets[0] ?? null);
      }
    } catch (err) {
      enqueueToast({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : t("checklists.upload_document.error_selecting_file", {
                defaultValue: "Unable to select file. Please try again.",
              }),
      });
    }
  }, [enqueueToast, t]);

  const handleSubmit = useCallback(async () => {
    if (!selectedProcess || !selectedStep || !selectedFile) {
      enqueueToast({
        type: "error",
        message: t("checklists.upload_document.missing_fields", {
          defaultValue: "Please select a process, step, and file.",
        }),
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const section = selectedProcess;
      const itemId = selectedStep.id;

      let fileToUpload: File;
      if (Platform.OS === "web" && selectedFile instanceof File) {
        fileToUpload = selectedFile;
      } else {
        const asset = selectedFile as PickerAsset;
        if (!asset.uri) throw new Error("No file selected");
        fileToUpload = {
          uri: asset.uri,
          name: asset.name ?? "document",
          type: asset.mimeType ?? "application/octet-stream",
          size: asset.size ?? 0,
        } as unknown as File;
      }

      const newDocument = await uploadDocument(
        fileToUpload,
        "checklist",
        undefined,
        undefined,
        undefined
      );
      const documentId = newDocument.id;

      await linkDocumentToChecklistItem(transactionId, section, itemId, documentId);

      enqueueToast({
        type: "success",
        message: t("checklists.upload_document.success", {
          defaultValue: "Document attached successfully",
        }),
      });

      onSuccess?.();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to attach document";
      setError(msg);
      enqueueToast({ type: "error", message: msg });
      log.warn(LOG_CATEGORIES.API, "AddDocumentToStepModal: submit failed", { error: msg });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedProcess,
    selectedStep,
    selectedFile,
    transactionId,
    uploadDocument,
    enqueueToast,
    t,
    onSuccess,
    onClose,
  ]);

  const canSubmit = !!selectedProcess && !!selectedStep && !!selectedFile && !isSubmitting;

  const fileName =
    selectedFile instanceof File
      ? selectedFile.name
      : ((selectedFile as PickerAsset | null)?.name ?? null);

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("checklists.upload_document.title", { defaultValue: "Add Document to Step" })}
      showCloseButton
      size="lg"
    >
      <Box className="flex flex-row flex-col gap-4">
        <Box>
          <Text className="text-text-primary mb-2 text-sm font-semibold">
            {t("checklists.upload_document.select_process", { defaultValue: "Select process" })}
          </Text>
          <Box className="flex flex-row flex-wrap gap-2">
            {PROCESS_TABS.map((tab) => (
              <TouchableBox
                key={tab}
                label={`Select ${CHECKLIST_TITLES[tab]}`}
                className="border-border flex cursor-pointer flex-row items-center rounded border px-3 py-2"
                interactionStyles={{
                  hover: "bg-background-base",
                  pressed: "bg-primary-muted",
                }}
                onPress={() => handleProcessSelect(tab)}
              >
                <Box
                  className={`mr-2 h-4 w-4 flex-shrink-0 flex-row items-center justify-center rounded border ${
                    selectedProcess === tab
                      ? "border-primary bg-primary"
                      : "border-border bg-background-surface"
                  }`}
                >
                  {selectedProcess === tab && (
                    <Icon name="check" className="h-3 w-3 text-white" strokeWidth={4} />
                  )}
                </Box>
                <Text className="text-text-primary text-sm">{CHECKLIST_TITLES[tab]}</Text>
              </TouchableBox>
            ))}
          </Box>
        </Box>

        {selectedProcess && (
          <Box>
            <Text className="text-text-primary mb-2 text-sm font-semibold">
              {t("checklists.upload_document.select_step", { defaultValue: "Select step" })}
            </Text>
            {stepsLoading ? (
              <Text className="text-text-secondary text-sm">
                {t("checklists.loading", { defaultValue: "Loading..." })}
              </Text>
            ) : (
              <Box className="max-h-40 flex-col gap-1 overflow-y-auto">
                {steps.map((item) => (
                  <TouchableBox
                    key={item.id}
                    label={`Select ${item.label}`}
                    className="border-border flex cursor-pointer flex-row items-center gap-2 rounded border p-2"
                    interactionStyles={{
                      hover: "bg-background-base",
                      pressed: "bg-primary-muted",
                    }}
                    onPress={() => handleStepSelect(item)}
                  >
                    <Box
                      className={`flex h-4 w-4 flex-shrink-0 flex-row items-center justify-center rounded border ${
                        selectedStep?.id === item.id
                          ? "border-primary bg-primary"
                          : "border-border bg-background-surface"
                      }`}
                    >
                      {selectedStep?.id === item.id && (
                        <Icon name="check" className="h-3 w-3 text-white" strokeWidth={4} />
                      )}
                    </Box>
                    <Text className="text-text-primary text-sm">{item.label}</Text>
                  </TouchableBox>
                ))}
              </Box>
            )}
          </Box>
        )}

        <Box>
          <Text className="text-text-primary mb-2 text-sm font-semibold">
            {t("checklists.upload_document.document_file", { defaultValue: "Document file" })}
          </Text>
          {Platform.OS === "web" ? (
            <Box>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                onChange={handleFileSelectWeb}
                className="hidden"
                id="add-document-file-input"
              />
              <Button
                variant="secondary"
                size="md"
                onPress={() => fileInputRef.current?.click()}
                label={
                  fileName ??
                  t("checklists.upload_document.select_file", { defaultValue: "Select file" })
                }
              >
                {fileName ??
                  t("checklists.upload_document.select_file", { defaultValue: "Select file" })}
              </Button>
            </Box>
          ) : (
            <Button
              variant="secondary"
              size="md"
              onPress={handleFileSelectNative}
              label={
                fileName ??
                t("checklists.upload_document.select_file", { defaultValue: "Select file" })
              }
            >
              {fileName ??
                t("checklists.upload_document.select_file", { defaultValue: "Select file" })}
            </Button>
          )}
        </Box>

        {error && (
          <Box className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <Text className="text-sm text-amber-800">{error}</Text>
          </Box>
        )}

        <Box className="border-border flex flex-row justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onPress={onClose} label="Cancel">
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            variant="primary"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!canSubmit}
            label="Attach document"
          >
            {t("checklists.upload_document.attach", { defaultValue: "Attach" })}
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
}
