import { useCallback, useEffect, useState } from "react";

import { Icon } from "@ui/icons";

import { attachSkyslopeForms, getSkyslopeFormsForStep, type SkyslopeForm } from "packages/api";
import { useLocalization } from "packages/contexts";
import { log, LOG_CATEGORIES } from "packages/logger";
import Button from "packages/ui/components/button/Button";
import { BaseModal } from "packages/ui/components/modals";
import { Box, Text, TouchableBox } from "packages/ui/components/primitives";

type AddFromSkySlopeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  section: string;
  itemId: number;
  suggestedFormIds?: string[];
  onSuccess?: () => void;
};

export default function AddFromSkySlopeModal({
  isOpen,
  onClose,
  transactionId,
  section,
  itemId,
  onSuccess,
}: AddFromSkySlopeModalProps) {
  const { t } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [formsLoading, setFormsLoading] = useState(false);
  const [suggested, setSuggested] = useState<SkyslopeForm[]>([]);
  const [other, setOther] = useState<SkyslopeForm[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const fetchForms = useCallback(async () => {
    if (!isOpen || !transactionId) return;
    setFormsLoading(true);
    setError(null);
    try {
      const data = await getSkyslopeFormsForStep(transactionId, section, itemId);
      setSuggested(data.suggested);
      setOther(data.other);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load forms";
      setError(msg);
      if (msg.includes("skyslope_not_connected") || msg.includes("not connected")) {
        setError(
          t("checklists.skyslope_not_connected", {
            defaultValue: "Connect SkySlope first to browse forms.",
          })
        );
      }
      log.warn(LOG_CATEGORIES.API, "AddFromSkySlopeModal: fetch forms failed", { error: msg });
    } finally {
      setFormsLoading(false);
    }
  }, [isOpen, transactionId, section, itemId, t]);

  useEffect(() => {
    void fetchForms();
  }, [fetchForms]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAttach = async () => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    setError(null);
    try {
      await attachSkyslopeForms(transactionId, Array.from(selectedIds), section, itemId);
      onSuccess?.();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to attach forms";
      setError(msg);
      log.warn(LOG_CATEGORIES.API, "AddFromSkySlopeModal: attach failed", { error: msg });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const allForms = [...suggested, ...other];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("checklists.add_from_skyslope", { defaultValue: "Add from SkySlope" })}
      showCloseButton
      size="lg"
    >
      <Box className="flex flex-row flex-col gap-4">
        {formsLoading ? (
          <Text className="text-text-secondary text-sm">
            {t("checklists.loading_forms", { defaultValue: "Loading forms..." })}
          </Text>
        ) : error ? (
          <Box className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <Text className="text-sm text-amber-800">{error}</Text>
          </Box>
        ) : (
          <>
            {suggested.length > 0 && (
              <Box>
                <Text className="text-text-primary mb-2 text-sm font-semibold">
                  {t("checklists.recommended_for_step", {
                    defaultValue: "Recommended for this step",
                  })}
                </Text>
                <Box className="flex flex-row flex-col gap-1">
                  {suggested.map((form) => (
                    <TouchableBox
                      key={form.id}
                      label={`${selectedIds.has(form.id) ? "Deselect" : "Select"} ${form.name}`}
                      className="border-border flex cursor-pointer flex-row items-center gap-2 rounded border p-2"
                      interactionStyles={{
                        hover: "bg-background-base",
                        pressed: "bg-primary-muted",
                      }}
                      onPress={() => toggleSelect(form.id)}
                    >
                      <Box
                        className={`flex h-4 w-4 flex-shrink-0 flex-row items-center justify-center rounded border ${selectedIds.has(form.id) ? "border-primary bg-primary" : "border-border bg-background-surface"}`}
                      >
                        {selectedIds.has(form.id) && (
                          <Icon name="check" className="h-3 w-3 text-white" strokeWidth={4} />
                        )}
                      </Box>
                      <Text className="text-text-primary text-sm">{form.name}</Text>
                    </TouchableBox>
                  ))}
                </Box>
              </Box>
            )}
            {other.length > 0 && (
              <Box>
                <Text className="text-text-primary mb-2 text-sm font-semibold">
                  {t("checklists.all_forms", { defaultValue: "All forms" })}
                </Text>
                <Box className="max-h-48 flex-col gap-1 overflow-y-auto">
                  {other.map((form) => (
                    <TouchableBox
                      key={form.id}
                      label={`${selectedIds.has(form.id) ? "Deselect" : "Select"} ${form.name}`}
                      className="border-border flex cursor-pointer flex-row items-center gap-2 rounded border p-2"
                      interactionStyles={{
                        hover: "bg-background-base",
                        pressed: "bg-primary-muted",
                      }}
                      onPress={() => toggleSelect(form.id)}
                    >
                      <Box
                        className={`flex h-4 w-4 flex-shrink-0 flex-row items-center justify-center rounded border ${selectedIds.has(form.id) ? "border-primary bg-primary" : "border-border bg-background-surface"}`}
                      >
                        {selectedIds.has(form.id) && (
                          <Icon name="check" className="h-3 w-3 text-white" strokeWidth={4} />
                        )}
                      </Box>
                      <Text className="text-text-primary text-sm">{form.name}</Text>
                    </TouchableBox>
                  ))}
                </Box>
              </Box>
            )}
            {allForms.length === 0 && (
              <Text className="text-text-secondary text-sm">
                {t("checklists.no_forms_available", { defaultValue: "No forms available." })}
              </Text>
            )}
          </>
        )}

        <Box className="border-border flex flex-row justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onPress={onClose} label="Cancel">
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            variant="primary"
            onPress={handleAttach}
            loading={loading}
            disabled={selectedIds.size === 0 || formsLoading}
            label="Attach selected forms"
          >
            {t("checklists.attach_forms", { defaultValue: "Attach" })} ({selectedIds.size})
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
}
