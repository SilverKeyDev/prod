/**
 * Plaid Link Modal Component
 * Handles Plaid Link integration for connecting bank accounts
 */

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { usePlaidLink } from "react-plaid-link";
import BaseModal from "./BaseModal";
import Button from "../ui/button/Button";
import {
  usePlaidLinkToken,
  usePlaidTokenExchange,
} from "../../core/hooks/data/usePlaid";
import { usePlaidStore } from "../../core/store/plaid.slice";
import { useUIStore } from "../../core/store/ui.slice";
import type { PlaidLinkConfig } from "../../core/schemas/plaid";

interface PlaidLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (itemId: string) => void;
  products?: string[];
}

export function PlaidLinkModal({
  isOpen,
  onClose,
  onSuccess,
  products = ["assets"],
}: PlaidLinkModalProps) {
  const { enqueueToast } = useUIStore();
  const setIsLinkOpen = usePlaidStore((state) => state.setIsLinkOpen);
  const { linkToken, linkTokenLoading, linkTokenError, createLinkToken } =
    usePlaidLinkToken();
  const exchangeTokenMutation = usePlaidTokenExchange();

  const [isInitializing, setIsInitializing] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const hasAttemptedTokenCreation = useRef(false);

  // Initialize Plaid Link when modal opens
  useEffect(() => {
    if (
      isOpen &&
      !linkToken &&
      !linkTokenLoading &&
      !hasAttemptedTokenCreation.current
    ) {
      setIsInitializing(true);
      setHasAutoOpened(false);
      hasAttemptedTokenCreation.current = true;
      createLinkToken(products).finally(() => setIsInitializing(false));
    }
  }, [isOpen, linkToken, linkTokenLoading, products]);

  // Reset the attempt flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasAttemptedTokenCreation.current = false;
    }
  }, [isOpen]);

  // Handle Plaid Link success
  const handlePlaidSuccess = useCallback(
    async (publicToken: string, _metadata: any) => {
      try {
        setIsLinkOpen(false);
        const result = await exchangeTokenMutation.mutateAsync(publicToken);

        enqueueToast({
          type: "success",
          message: "Bank account connected successfully!",
        });

        if (onSuccess && result?.item_id) {
          onSuccess(result.item_id);
        }
      } catch (error) {
        console.error("Plaid token exchange error:", error);
        enqueueToast({
          type: "error",
          message: "Failed to connect bank account. Please try again.",
        });
      }
    },
    [exchangeTokenMutation, enqueueToast, onSuccess]
  );

  // Handle Plaid Link exit
  const handlePlaidExit = useCallback(
    (error: any, metadata: any) => {
      console.log("Plaid Link exited:", { error, metadata });
      setIsLinkOpen(false);
      onClose();
    },
    [onClose]
  );

  // Handle Plaid Link events
  const handlePlaidEvent = useCallback((eventName: string, metadata: any) => {
    console.log("Plaid Link event:", eventName, metadata);
  }, []);

  // Configure Plaid Link
  const config: PlaidLinkConfig = useMemo(
    () => ({
      token: linkToken || "",
      onSuccess: handlePlaidSuccess,
      onExit: handlePlaidExit,
      onEvent: handlePlaidEvent,
    }),
    [linkToken, handlePlaidSuccess, handlePlaidExit, handlePlaidEvent]
  );

  const { open, ready } = usePlaidLink(config);
  const openRef = useRef(open);

  // Keep ref updated
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Auto-open Plaid Link when ready
  useEffect(() => {
    if (isOpen && ready && linkToken && !hasAutoOpened) {
      setHasAutoOpened(true);
      openRef.current();
    }
  }, [isOpen, ready, linkToken, hasAutoOpened]);

  // Handle modal close
  const handleClose = () => {
    setIsLinkOpen(false);
    setHasAutoOpened(false);
    onClose();
  };

  // Show loading state
  if (linkTokenLoading || isInitializing) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Connecting Bank Account"
        size="md"
      >
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Initializing secure connection...</p>
        </div>
      </BaseModal>
    );
  }

  // Show error state
  if (linkTokenError) {
    const isPlaidNotConfigured =
      linkTokenError.includes("PLAID_NOT_CONFIGURED") ||
      linkTokenError.includes("PLAID_CLIENT_ID") ||
      linkTokenError.includes("PLAID_SECRET");

    return (
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        title={
          isPlaidNotConfigured ? "Service Unavailable" : "Connection Error"
        }
        size="md"
      >
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">
            {isPlaidNotConfigured
              ? "Bank account connection is temporarily unavailable. Please try again later or contact support."
              : linkTokenError}
          </p>
          <Button onClick={handleClose} variant="primary">
            Close
          </Button>
        </div>
      </BaseModal>
    );
  }

  // Show Plaid Link interface
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Connect Bank Account"
      size="lg"
    >
      <div className="flex flex-col items-center justify-center py-8">
        <div className="text-blue-500 mb-4">
          <svg
            className="w-12 h-12 mx-auto"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Secure Bank Connection
        </h3>
        <p className="text-gray-600 mb-6 text-center">
          Connect your bank account securely through Plaid to generate proof of
          funds reports.
        </p>
        <Button
          onClick={() => open()}
          variant="primary"
          size="lg"
          disabled={!ready}
        >
          {ready ? "Connect Bank Account" : "Loading..."}
        </Button>
      </div>
    </BaseModal>
  );
}
