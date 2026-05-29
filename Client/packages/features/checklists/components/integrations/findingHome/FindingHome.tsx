import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getTransactionAddress,
  saveTransactionAddress,
} from "packages/features/checklists/api/checklists";
import { hasFindingHomeAddressChanges } from "packages/features/checklists/components/integrations/findingHome/findingHomeAddressChanges";
import { ChecklistStepSubmitFooter } from "packages/features/checklists/components/steps/ChecklistStepSubmitFooter";
import { useGoogleMapsStore } from "packages/store";
import { GooglePlacesAutocompleteField } from "packages/ui/components";
import Card from "packages/ui/components/cards/Card";
import type { AddressData } from "packages/ui/components/form/AddressInput/AddressInput";
import { Box, Text } from "packages/ui/components/primitives";

type FindingHomeProps = {
  onSave?: (address: string) => void;
  onComplete?: () => void;
};

export default function FindingHome({ onSave, onComplete }: FindingHomeProps) {
  const queryClient = useQueryClient();
  const [address, setAddress] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  const { isLoaded: googleMapsLoaded } = useGoogleMapsStore();
  const scriptsReady = !!googleMapsLoaded;

  const { data: savedAddress } = useQuery({
    queryKey: ["transaction", "address"],
    queryFn: getTransactionAddress,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (savedAddress?.address) {
      setAddress(savedAddress.address);
    }
  }, [savedAddress?.address]);

  const saveMutation = useMutation({
    mutationFn: saveTransactionAddress,
    onSuccess: (data) => {
      const previous = queryClient.getQueryData<{ address?: string | null } | null>([
        "transaction",
        "address",
      ]);
      const wasFirstSave = !(previous?.address ?? "").trim();
      queryClient.setQueryData(["transaction", "address"], data);
      onSave?.(data.address);
      if (wasFirstSave) {
        onComplete?.();
      }
    },
  });

  const buildPayload = useCallback(() => {
    const trimmed = address.trim();
    if (!trimmed) return null;
    if (selectedAddress) {
      return {
        address: selectedAddress.address,
        place_id: selectedAddress.place_id,
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
        postal_code: selectedAddress.postal_code,
        country: selectedAddress.country,
      };
    }
    return { address: trimmed };
  }, [address, selectedAddress]);

  const canSubmit = useMemo(
    () => hasFindingHomeAddressChanges(address, savedAddress),
    [address, savedAddress]
  );

  const handleSubmitStep = useCallback(() => {
    const payload = buildPayload();
    if (!payload || saveMutation.isPending) return;
    saveMutation.mutate(payload);
  }, [buildPayload, saveMutation]);

  return (
    <>
      <Card border="dotted" padding="md" className="mb-2">
        <Box className="gap-3">
          <Text className="text-text-primary text-sm font-medium">
            Enter the address of the home you want to make an offer on
          </Text>
          <Box className="mb-4">
            <GooglePlacesAutocompleteField
              value={address}
              onChange={(value) => {
                setAddress(value);
                setSelectedAddress(null);
              }}
              onSelect={(data) => {
                setAddress(data.address);
                setSelectedAddress(data);
              }}
              scriptsReady={scriptsReady}
              placeholder="e.g., 123 Main St, San Francisco, CA 94102"
              disabled={saveMutation.isPending}
            />
          </Box>
          <ChecklistStepSubmitFooter
            disabled={!canSubmit || saveMutation.isPending}
            onSubmit={handleSubmitStep}
          />
          {saveMutation.isError && (
            <Text className="text-destructive text-sm">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save address"}
            </Text>
          )}
        </Box>
      </Card>
    </>
  );
}
