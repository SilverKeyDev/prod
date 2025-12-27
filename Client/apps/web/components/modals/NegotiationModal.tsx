import { useEffect, useRef, useCallback } from "react";

import BaseModal from "./BaseModal";
import { useNegotiationStore } from "../../../../packages/store/negotiation.slice";
import {
  HomeSelectorSection,
  LoadingSection,
  ErrorSection,
  ComparablesSection,
  OpeningOfferSection,
  DebugSection,
  StrategyDisplaySection,
} from "../../features/negotiate";
import { negotiationService } from "../../../../packages/services/negotiation";

// Types for negotiation data
type FavoriteHome = {
  user_id: string;
  address: string;
  beds: string;
  baths: string;
  sqft: string;
  lot_size: string;
  price: string;
  image_url: string;
  created_at: string;
  updated_at: string;
};

type NegotiationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialHome?: FavoriteHome | null;
};

export default function NegotiationModal({
  isOpen,
  onClose,
  initialHome,
}: NegotiationModalProps) {
  const {
    selectedHome,
    strategyData,
    compsData,
    isLoading,
    error,
    setLoading,
    setError,
  } = useNegotiationStore();

  // Ref for the price element to scroll to
  const priceElementRef = useRef<HTMLDivElement>(null);
  const previousLoadingRef = useRef<boolean>(false);
  // Ref to track the last home address we generated for (to prevent duplicate generation)
  const lastGeneratedHomeRef = useRef<string | null>(null);

  // Normalized boolean flag so we never treat `unknown` as a ReactNode
  const hasStrategyData = Boolean(strategyData);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    await negotiationService.generateStrategy();
  }, [setLoading, setError]);

  // Set initial home and auto-generate when modal opens
  useEffect(() => {
    if (isOpen && initialHome) {
      const homeAddress = initialHome.address;

      // Only generate if this is a different home than the last one we generated for
      if (lastGeneratedHomeRef.current !== homeAddress) {
        lastGeneratedHomeRef.current = homeAddress;
        negotiationService.selectHome(initialHome);

        // Auto-generate strategy after a short delay to ensure home is selected
        const generateTimer = setTimeout(async () => {
          setLoading(true);
          setError(null);
          await negotiationService.generateStrategy();
        }, 100);

        return () => {
          clearTimeout(generateTimer);
        };
      }
    } else if (!isOpen) {
      // Reset the last generated home when modal closes
      lastGeneratedHomeRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialHome?.address, setLoading, setError]); // Only depend on address, not the whole object

  // Create handler functions for compatibility
  const handleHomeSelection = (home: unknown) => {
    negotiationService.selectHome(home);
  };

  const handleShareJson = async () => {
    await negotiationService.shareStrategyJson();
  };

  // Extract error message for proper type handling
  const errorMessage: string | null =
    error && typeof error !== "object"
      ? typeof error === "string"
        ? error
        : String(error)
      : null;

  // Auto-scroll to price element when strategy finishes loading
  useEffect(() => {
    // Check if loading just finished (was true, now false)
    const loadingJustFinished =
      previousLoadingRef.current === true && isLoading === false;

    if (loadingJustFinished && priceElementRef.current && strategyData) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        priceElementRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }, 100);
    }

    // Update previous loading state
    previousLoadingRef.current = isLoading;
  }, [isLoading, strategyData]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      showCloseButton={true}
      className="max-w-7xl"
    >
      <div>
        {/* Main Content */}
        <div>
          {/* Home selector */}
          <HomeSelectorSection
            selectedHome={
              selectedHome && typeof selectedHome === "object"
                ? (selectedHome as FavoriteHome)
                : null
            }
            isLoading={isLoading}
            onHomeSelect={handleHomeSelection}
            onGenerate={handleGenerate}
          />

          {/* Loading state */}
          {isLoading && <LoadingSection />}

          {/* Error display */}
          {errorMessage ? <ErrorSection errorMessage={errorMessage} /> : null}

          <ComparablesSection compsData={compsData} isLoading={isLoading} />

          {/* Recommended Opening Offer - Displayed after comps */}
          <OpeningOfferSection
            strategyData={strategyData}
            priceElementRef={priceElementRef}
          />

          {/* Property Comps Debug JSON (fallback) */}
          <DebugSection compsData={compsData} isLoading={isLoading} />

          {/* Strategy output - Dynamic display of all AI fields */}
          {hasStrategyData && !isLoading && (
            <StrategyDisplaySection
              strategyData={strategyData}
              onShareJson={handleShareJson}
            />
          )}
        </div>
      </div>
    </BaseModal>
  );
}
