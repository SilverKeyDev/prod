import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { getChecklistItemDocuments } from "packages/api";
import { useLocalization } from "packages/contexts";
import type { Agreement } from "packages/types";
import Button from "packages/ui/components/button/Button";
import { Box, Text } from "packages/ui/components/primitives";

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
    <Box className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <Box className="mb-2 flex flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-gray-900">
          {t("checklists.documents_for_step", { defaultValue: "Documents for this step" })}
        </Text>
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

      {isLoading ? (
        <Text className="text-xs text-gray-600">
          {t("checklists.loading", { defaultValue: "Loading..." })}
        </Text>
      ) : agreements.length === 0 ? (
        <Text className="text-xs text-gray-600">
          {t("checklists.no_documents", { defaultValue: "No documents linked yet." })}
        </Text>
      ) : (
        <Box className="flex flex-row flex-col gap-1">
          {agreements.map((agreement: Agreement) => (
            <Box
              key={agreement.id}
              className="flex flex-row items-center justify-between rounded border border-gray-200 bg-white p-2"
            >
              <Text className="text-sm text-gray-800">{agreement.title}</Text>
              <Text className="text-xs text-gray-500">{agreement.status}</Text>
            </Box>
          ))}
        </Box>
      )}

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
