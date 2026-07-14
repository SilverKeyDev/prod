import { useEffect, useState } from "react";

import type { CampaignCategoryId } from "packages/features/brokerage/hooks/useCampaigns";
import {
  type BuiltInCampaignCategoryId,
  CAMPAIGN_TEMPLATES,
} from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import { Button, CancelButton, Textarea } from "packages/ui";
import { Input } from "packages/ui/components/inputs/form/inputs/Input.web";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Label from "packages/ui/components/structure/text/Label";
import Title from "packages/ui/components/structure/text/Title";
import BaseModal from "packages/ui/components/surfaces/modals/BaseModal";

type CreateCampaignModalProps = {
  isOpen: boolean;
  activeCategoryIds: CampaignCategoryId[];
  onClose: () => void;
  onSelectTemplate: (templateId: BuiltInCampaignCategoryId) => void;
  onCreateCustom: (name: string, description?: string) => void;
};

export function CreateCampaignModal({
  isOpen,
  activeCategoryIds,
  onClose,
  onSelectTemplate,
  onCreateCustom,
}: CreateCampaignModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setDescription("");
    setError(null);
  }, [isOpen]);

  const handleCustomSubmit = () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    onCreateCustom(name.trim(), description.trim() || undefined);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="New campaign"
      size="md"
      showCloseButton
      footerContent={
        <Box className="flex justify-end gap-2">
          <CancelButton onClick={onClose}>Cancel</CancelButton>
          <Button type="button" variant="primary" onClick={handleCustomSubmit}>
            Create custom
          </Button>
        </Box>
      }
    >
      <Box className="flex flex-col gap-5" data-testid="create-campaign-modal">
        <Box className="flex flex-col gap-3">
          <Title size="sm" as="h3">
            Templates
          </Title>
          <Box className="flex flex-col gap-2" data-testid="campaign-template-list">
            {CAMPAIGN_TEMPLATES.map((template) => {
              const alreadyActive = activeCategoryIds.includes(template.id);
              return (
                <Box
                  key={template.id}
                  className="border-border flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  data-testid={`campaign-template-${template.id}`}
                >
                  <Box className="min-w-0 flex-1">
                    <BodyText size="sm" className="font-semibold">
                      {template.label}
                    </BodyText>
                    <BodyText size="xs" muted>
                      {template.blurb}
                    </BodyText>
                  </Box>
                  <Button
                    type="button"
                    variant={alreadyActive ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => onSelectTemplate(template.id)}
                  >
                    {alreadyActive ? "Go to section" : "Add"}
                  </Button>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box className="border-border border-t pt-4">
          <Title size="sm" as="h3" className="mb-3">
            Custom
          </Title>
          <Box className="flex flex-col gap-3">
            <Input
              label="Name"
              value={name}
              onValueChange={setName}
              required
              placeholder="Campaign name"
            />
            <Box>
              <Label htmlFor="create-campaign-description" className="mb-2">
                Description
              </Label>
              <Textarea
                id="create-campaign-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional short description"
              />
            </Box>
            {error ? (
              <BodyText size="xs" className="text-state-danger" role="alert">
                {error}
              </BodyText>
            ) : null}
          </Box>
        </Box>
      </Box>
    </BaseModal>
  );
}
