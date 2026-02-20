import { useState } from "react";

import { Home } from "lucide-react";

import { useSavedHomesData } from "packages/hooks/data/search/saved/useSavedHomesData";
import type { SavedHome } from "packages/schemas/property";

import BaseModal from "@/components/modals/BaseModal";
import Button from "@/components/ui/button/Button";
import CancelButton from "@/components/ui/button/CancelButton";
import { BodyText, Title } from "@/components/ui/index.web";
import KeyTurnLoader from "@/components/ui/loading/KeyTurnLoader.web";

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
  const [selectedHomeId, setSelectedHomeId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedHomeId) {
      const home = savedHomes.find((h) => h.home_id === selectedHomeId);
      if (home) {
        onSelect(home);
        setSelectedHomeId(null);
      }
    }
  };

  const selectedHome = selectedHomeId
    ? savedHomes.find((h) => h.home_id === selectedHomeId)
    : null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      headerContent={
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 flex-shrink-0 text-gray-900" />
          <Title
            as="h3"
            size="lg"
            className="truncate font-medium text-gray-900 sm:text-lg"
          >
            Select Home to Share
          </Title>
        </div>
      }
      size="md"
    >
      <div className="space-y-4">
        {savedHomesLoading ? (
          <div className="flex items-center justify-center py-8">
            <KeyTurnLoader message="Loading homes..." />
          </div>
        ) : savedHomes.length === 0 ? (
          <div className="py-8 text-center">
            <BodyText as="p" size="sm" className="text-gray-500">
              No saved homes found. Save homes to share them in messages.
            </BodyText>
          </div>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {savedHomes.map((home, index) => (
              <Button
                key={home.home_id || `home-${index}`}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedHomeId(home.home_id)}
                className={`w-full rounded-lg border p-3 text-left justify-start h-auto min-h-0 ${
                  selectedHomeId === home.home_id
                    ? "border-olive bg-olive/10"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-beige/20">
                    <Home className="h-5 w-5 text-olive" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <BodyText
                      as="p"
                      size="sm"
                      className="font-medium text-gray-900"
                    >
                      {home.address || `Property ${home.home_id}`}
                    </BodyText>
                    {home.price && (
                      <BodyText as="p" size="xs" className="mt-1 text-gray-500">
                        {typeof home.price === "number"
                          ? `$${home.price.toLocaleString()}`
                          : home.price}
                      </BodyText>
                    )}
                    {home.bedrooms && home.bathrooms && (
                      <BodyText as="p" size="xs" className="mt-1 text-gray-500">
                        {home.bedrooms} bed • {home.bathrooms} bath
                        {home.sqft
                          ? ` • ${home.sqft.toLocaleString()} sqft`
                          : ""}
                      </BodyText>
                    )}
                  </div>
                  {selectedHomeId === home.home_id && (
                    <div className="h-2 w-2 flex-shrink-0 rounded-full bg-olive self-center" />
                  )}
                </div>
              </Button>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <CancelButton onClick={onClose} className="flex-1">
            Cancel
          </CancelButton>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedHome}
            className="flex-1"
            iconName="share"
          >
            Share Home
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
