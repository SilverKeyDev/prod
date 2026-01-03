import { Home } from "lucide-react";
import { useState } from "react";

import BaseModal from "../../../components/modals/BaseModal";
import Button from "../../../components/ui/button/Button";
import KeyTurnLoader from "../../../components/ui/loading/KeyTurnLoader";
import { useSavedHomesData } from "../../../../../packages/hooks/data/useSavedHomesData";
import type { SavedHome } from "../../../../../packages/schemas/property";

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
      title="Select Home to Share"
      size="md"
    >
      <div className="space-y-4">
        {savedHomesLoading ? (
          <div className="flex items-center justify-center py-8">
            <KeyTurnLoader message="Loading homes..." />
          </div>
        ) : savedHomes.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">
              No saved homes found. Save homes to share them in messages.
            </p>
          </div>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {savedHomes.map((home) => (
              <button
                key={home.home_id}
                onClick={() => setSelectedHomeId(home.home_id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedHomeId === home.home_id
                    ? "border-brown bg-beige/20"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-beige/20">
                    <Home className="h-5 w-5 text-brown" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {home.address || `Property ${home.home_id}`}
                    </p>
                    {home.price && (
                      <p className="mt-1 text-xs text-gray-500">
                        {typeof home.price === "number"
                          ? `$${home.price.toLocaleString()}`
                          : home.price}
                      </p>
                    )}
                    {home.bedrooms && home.bathrooms && (
                      <p className="mt-1 text-xs text-gray-500">
                        {home.bedrooms} bed • {home.bathrooms} bath
                        {home.sqft ? ` • ${home.sqft.toLocaleString()} sqft` : ""}
                      </p>
                    )}
                  </div>
                  {selectedHomeId === home.home_id && (
                    <div className="h-2 w-2 flex-shrink-0 rounded-full bg-brown self-center" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedHome}
            className="flex-1"
          >
            Share Home
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}

