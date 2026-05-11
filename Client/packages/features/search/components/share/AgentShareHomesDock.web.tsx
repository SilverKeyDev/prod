import React, { useCallback } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { SearchResult } from "packages/features/search/types/domain/result";
import { useAgentSearchShareBundleDock } from "packages/hooks/data";
import { useUIStore } from "packages/store";
import { Button, ClientSelector } from "packages/ui";
import { SelectionBottomDock } from "packages/ui/components/layout";

export type AgentShareHomesDockProps = {
  selectedProperties: SearchResult[];
  selectedClientId: string | null;
  onClientChange: (clientId: string | null) => void;
  onRemove: (propertyId: string) => void;
  onClear: () => void;
};

export function AgentShareHomesDock({
  selectedProperties,
  selectedClientId,
  onClientChange,
  onRemove,
  onClear,
}: AgentShareHomesDockProps): React.ReactElement | null {
  const { t } = useLocalization();
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const { clients, isLoadingClients, sendBundle, isSending } = useAgentSearchShareBundleDock();

  const handleShare = useCallback(async () => {
    const ok = await sendBundle(selectedProperties, selectedClientId);
    if (ok) {
      enqueueToast({
        type: "success",
        message: t("property_details.messaging_share_success"),
      });
      onClear();
    } else {
      enqueueToast({
        type: "error",
        message: t("property_details.messaging_share_error"),
      });
    }
  }, [sendBundle, selectedProperties, selectedClientId, enqueueToast, t, onClear]);

  if (selectedProperties.length < 1) {
    return null;
  }

  if (isLoadingClients) {
    return null;
  }
  if (clients.length === 0) {
    return null;
  }

  const countLabel =
    selectedProperties.length === 1
      ? t("search.agent_share_home_selected")
      : t("search.agent_share_homes_selected", {
          count: selectedProperties.length,
        });

  const items = selectedProperties.map((p) => ({
    id: p.id,
    imageUrl: p.imageUrl,
    thumbnailAlt:
      typeof p.address === "string" ? p.address : t("compare_floating.property_fallback"),
  }));

  const moreCountLabel =
    selectedProperties.length > 4
      ? t("compare_floating.more_count", {
          count: selectedProperties.length - 4,
        })
      : undefined;

  const canShare = selectedClientId !== null && !isLoadingClients;

  return (
    <SelectionBottomDock
      items={items}
      countLabel={countLabel}
      summaryIcon={<Icon name="share" className="text-primary h-4 w-4 sm:h-5 sm:w-5" />}
      thumbnailFallbackIcon={<Icon name="share" className="text-text-disabled h-5 w-5" />}
      onRemove={onRemove}
      onClear={onClear}
      clearLabel={t("compare_floating.clear")}
      clearAriaLabel={t("compare_floating.clear_aria")}
      removeThumbnailAriaLabel={t("compare_floating.remove_aria")}
      moreCountLabel={moreCountLabel}
      outerClassName="md:left-52"
    >
      <ClientSelector
        selectedClientId={selectedClientId}
        onClientChange={onClientChange}
        hideMeOption
        menuPlacement="above"
        className="min-w-0 max-w-48 shrink-0"
      />
      <Button
        variant="primary"
        size="sm"
        onClick={() => {
          void handleShare();
        }}
        disabled={!canShare || isSending}
        icon={<Icon name="share" className="h-4 w-4" />}
        className="flex-1 sm:flex-none"
      >
        {t("property_details.messaging_share_button")}
      </Button>
    </SelectionBottomDock>
  );
}
