import React, { useCallback, useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getTransactionAddress,
  saveTransactionAddress,
} from "packages/features/checklists/api/checklists";
import { useGoogleMapsStore } from "packages/store";
import Button from "packages/ui/components/button/Button";
import Card from "packages/ui/components/cards/Card";
import type { AddressData } from "packages/ui/components/form/AddressInput";
import { AddressInput } from "packages/ui/components/form/AddressInput";
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
      queryClient.setQueryData(["transaction", "address"], data);
      onSave?.(data.address);
      onComplete?.();
    },
  });

  const handleSave = useCallback(() => {
    const trimmed = address.trim();
    if (!trimmed) return;
    const payload = selectedAddress
      ? {
          address: selectedAddress.address,
          place_id: selectedAddress.place_id,
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postal_code: selectedAddress.postal_code,
          country: selectedAddress.country,
        }
      : { address: trimmed };
    saveMutation.mutate(payload);
  }, [address, selectedAddress, saveMutation]);

  const canSave = address.trim().length > 0 && !saveMutation.isPending;

  return (
    <>
      <Card padding="md" className="mb-2">
        <Box className="gap-3">
          <Text className="text-text-primary text-sm font-medium">
            Enter the address of the home you want to make an offer on
          </Text>
          <AddressInput
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
          <Box className="flex flex-row flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="md"
              onPress={handleSave}
              disabled={!canSave}
              loading={saveMutation.isPending}
            >
              Save address
            </Button>
          </Box>
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
