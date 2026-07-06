import { useCallback, useMemo, useState } from "react";

import {
  filterBrokerageIds,
  listRecentBrokerageIds,
} from "packages/features/admin/utils/integrations/adminSkySlopeRecentBrokerages";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Label from "packages/ui/components/structure/text/Label.web";

import Card from "@/components/layout/Card.web";
import { Button, Dropdown, Input } from "@/components/ui";

type BrokerageIdPickerProps = {
  selectedBrokerageId: string | null;
  onSelect: (brokerageId: string) => void;
  disabled?: boolean;
};

export function BrokerageIdPicker({
  selectedBrokerageId,
  onSelect,
  disabled = false,
}: BrokerageIdPickerProps) {
  const [draftId, setDraftId] = useState(selectedBrokerageId ?? "");
  const recentIds = useMemo(() => listRecentBrokerageIds(), []);

  const dropdownOptions = useMemo(
    () =>
      recentIds.map((id) => ({
        value: id,
        label: id,
      })),
    [recentIds]
  );

  const handleApply = useCallback(() => {
    const trimmed = draftId.trim();
    if (!trimmed) return;
    onSelect(trimmed);
  }, [draftId, onSelect]);

  return (
    <Card border="light" padding="lg" className="w-full">
      <Label size="sm" className="mb-2 block">
        Brokerage
      </Label>
      <BodyText size="sm" muted className="mb-4 max-w-2xl">
        Search recent brokerage org IDs or paste the UUID from brokerage onboarding. SilverKey does
        not expose a brokerage directory in this MVP panel.
      </BodyText>

      <Box className="flex max-w-2xl flex-col gap-4">
        {dropdownOptions.length > 0 ? (
          <Box>
            <Label size="sm">Recent brokerages</Label>
            <Dropdown
              className="mt-1"
              label="Recent brokerages"
              hideLabel
              searchable
              clearable
              placeholder="Search recent brokerage IDs"
              options={dropdownOptions}
              value={selectedBrokerageId ?? undefined}
              disabled={disabled}
              onChange={(value) => {
                if (typeof value !== "string") return;
                setDraftId(value);
                onSelect(value);
              }}
              onClear={() => {
                setDraftId("");
              }}
            />
          </Box>
        ) : null}

        <Box className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Box className="min-w-0 flex-1">
            <Input
              label="Brokerage org ID"
              placeholder="UUID from brokerage_orgs.id"
              value={draftId}
              onChange={(e) => setDraftId(e.target.value)}
              disabled={disabled}
              autoComplete="off"
            />
          </Box>
          <Button
            variant="secondary"
            size="md"
            disabled={disabled || draftId.trim().length === 0}
            onClick={handleApply}
          >
            Load brokerage
          </Button>
        </Box>

        {draftId.trim().length > 0 &&
        filterBrokerageIds(recentIds, draftId).length === 0 &&
        draftId.trim() !== selectedBrokerageId ? (
          <BodyText size="xs" muted>
            Press Load brokerage to fetch SkySlope status for this org ID.
          </BodyText>
        ) : null}
      </Box>
    </Card>
  );
}
