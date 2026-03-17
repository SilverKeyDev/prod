import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { getChecklistItemDocuments } from "packages/api";
import { useLocalization } from "packages/contexts";
import type { Agreement } from "packages/types";
import Button from "packages/ui/components/button/Button";
import { Box, Text } from "packages/ui/components/primitives";

import AddDocumentToStepModal from "./AddDocumentToStepModal";
import AddFromSkySlopeModal from "./AddFromSkySlopeModal";

type ChecklistItemDocumentsProps = {
  transactionId: string;
  section: string;
  itemId: number;
  suggestedFormIds?: string[];
  isAgent: boolean;
};

export default function ChecklistItemDocuments({
  transactionId,
  section,
  itemId,
  suggestedFormIds,
  isAgent,
}: ChecklistItemDocumentsProps) {
  const { t } = useLocalization();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const {
    data: agreements = [],
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["checklist-item-documents", transactionId, section, itemId],
    queryFn: () => getChecklistItemDocuments(transactionId, section, itemId),
    enabled: !!transactionId && !!section && itemId != null,
  });

  const showAddButton = isAgent && suggestedFormIds && suggestedFormIds.length > 0;

  return (
    <Box className="border-border bg-background-base rounded-lg border p-3">
      <Box className="mb-2 flex flex-row items-center justify-between gap-2">
        <Text className="text-text-primary text-sm font-semibold">
          {t("checklists.documents_for_step", { defaultValue: "Documents for this step" })}
        </Text>
        {isAgent && (
          <Box className="flex flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onPress={() => setUploadModalOpen(true)}
              label="Upload document"
            >
              {t("checklists.upload_document.button", { defaultValue: "Upload document" })}
            </Button>
            {showAddButton && (
              <Button
                variant="outline"
                size="sm"
                onPress={() => setAddModalOpen(true)}
                label="Add from SkySlope"
              >
                {t("checklists.add_from_skyslope", { defaultValue: "Add from SkySlope" })}
              </Button>
            )}
          </Box>
        )}
      </Box>

      {isLoading ? (
        <Text className="text-text-secondary text-xs">
          {t("checklists.loading", { defaultValue: "Loading..." })}
        </Text>
      ) : agreements.length === 0 ? (
        <Text className="text-text-secondary text-xs">
          {t("checklists.no_documents", { defaultValue: "No documents linked yet." })}
        </Text>
      ) : (
        <Box className="flex flex-row flex-col gap-1">
          {agreements.map((agreement: Agreement) => (
            <Box
              key={agreement.id}
              className="border-border bg-background-surface flex flex-row items-center justify-between rounded border p-2"
            >
              <Text className="text-text-primary text-sm">{agreement.title}</Text>
              <Text className="text-text-secondary text-xs">{agreement.status}</Text>
            </Box>
          ))}
        </Box>
      )}

      <AddDocumentToStepModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        transactionId={transactionId}
        onSuccess={() => void refetch()}
      />
      <AddFromSkySlopeModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        transactionId={transactionId}
        section={section}
        itemId={itemId}
        suggestedFormIds={suggestedFormIds}
        onSuccess={() => void refetch()}
      />
    </Box>
  );
}
