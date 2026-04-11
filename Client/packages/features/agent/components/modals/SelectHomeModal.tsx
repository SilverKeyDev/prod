import { Icon } from "@ui/icons";

import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import Button from "packages/ui/components/button/Button";
import CancelButton from "packages/ui/components/button/CancelButton";
import { Box } from "packages/ui/components/primitives";

import BaseModal from "@/components/modals/BaseModal";
import { BodyText, Title } from "@/components/ui";
import { useSingleSelectionModal } from "@/features/agent/hooks/ui/useSingleSelectionModal";
import { useSavedHomesData } from "@/features/search/hooks/data/saved/useSavedHomesData";
import type { SavedHome } from "@/features/search/types/property";

type SelectHomeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (home: SavedHome) => void;
};

export default function SelectHomeModal({
  isOpen,
  onClose,
  onSelect,
}: SelectHomeModalProps) {
  const { savedHomes, savedHomesLoading } = useSavedHomesData();
  const {
    selectedId: selectedHomeId,
    setSelectedId: setSelectedHomeId,
    selectedItem: selectedHome,
    handleConfirm,
    isLoading: savedHomesLoadingFromHook,
  } = useSingleSelectionModal<SavedHome>(savedHomes, (h) => h.home_id ?? "", {
    isLoading: savedHomesLoading,
  });

  const onConfirm = () => handleConfirm(onSelect, { closeOnConfirm: false });
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      headerContent={
        <Box className="flex items-center gap-2">
          <Icon
            name="home"
            className="text-text-primary h-5 w-5 flex-shrink-0"
          />
          <Title
            as="h3"
            size="lg"
            className="text-text-primary truncate font-medium sm:text-lg"
          >
            Select Home to Share
          </Title>
        </Box>
      }
      size="md"
    >
      <Box className="space-y-4">
        {savedHomesLoadingFromHook ? (
          <Box className="flex items-center justify-center py-8">
            <KeyTurnLoader message="Loading homes..." />
          </Box>
        ) : savedHomes.length === 0 ? (
          <Box className="py-8 text-center">
            <BodyText as="p" size="sm" className="text-text-secondary">
              No saved homes found. Save homes to share them in messages.
            </BodyText>
          </Box>
        ) : (
          <Box className="max-h-96 space-y-2 overflow-y-auto">
            {savedHomes.map((home, index) => (
              <Button
                key={home.home_id || `home-${index}`}
                type="button"
                variant="outline"
                size="sm"
                contentAlign="start"
                onClick={() => setSelectedHomeId(home.home_id)}
                className={`h-auto min-h-0 w-full justify-start rounded-lg border p-3 text-left ${
                  selectedHomeId === home.home_id
                    ? "border-border bg-primary-muted"
                    : "border-border hover:border-border hover:bg-primary-muted"
                }`}
              >
                <Box className="flex w-full items-start gap-3">
                  <Box className="bg-accent-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                    <Icon name="home" className="text-primary h-5 w-5" />
                  </Box>
                  <Box className="min-w-0 flex-1">
                    <BodyText
                      as="p"
                      size="sm"
                      className="text-text-primary font-medium"
                    >
                      {home.address || `Property ${home.home_id}`}
                    </BodyText>
                    {home.price && (
                      <BodyText
                        as="p"
                        size="xs"
                        className="text-text-secondary mt-1"
                      >
                        {typeof home.price === "number"
                          ? `$${home.price.toLocaleString()}`
                          : home.price}
                      </BodyText>
                    )}
                    {home.bedrooms && home.bathrooms && (
                      <BodyText
                        as="p"
                        size="xs"
                        className="text-text-secondary mt-1"
                      >
                        {home.bedrooms} bed • {home.bathrooms} bath
                        {home.sqft
                          ? ` • ${home.sqft.toLocaleString()} sqft`
                          : ""}
                      </BodyText>
                    )}
                  </Box>
                  {selectedHomeId === home.home_id && (
                    <Box className="bg-primary h-2 w-2 flex-shrink-0 self-center rounded-full" />
                  )}
                </Box>
              </Button>
            ))}
          </Box>
        )}

        <Box className="flex gap-3 pt-2">
          <CancelButton onClick={onClose} className="flex-1">
            Cancel
          </CancelButton>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={!selectedHome}
            className="flex-1"
            iconName="share"
          >
            Share Home
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
}
