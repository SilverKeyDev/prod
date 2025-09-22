/**
 * Plaid Feature Component
 * Main feature component that integrates all Plaid functionality
 */

import { PlaidConnectionCard } from "../../components/cards/PlaidConnectionCard";
import { PlaidErrorBoundary } from "../../components/error/PlaidErrorBoundary";
import { usePlaidIntegration } from "../../core/hooks/data/usePlaidIntegration";

interface PlaidFeatureProps {
  className?: string;
}

function PlaidFeatureContent({ className }: PlaidFeatureProps) {
  // Note: Removed usePlaidIntegration to prevent infinite loops
  // Components will use hooks directly instead of going through the integration layer

  return (
    <div className={className}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Proof of Funds
          </h1>
          <p className="text-gray-600">
            Connect your bank accounts securely to generate proof of funds
            reports for your real estate transactions.
          </p>
        </div>

        <PlaidConnectionCard />
      </div>
    </div>
  );
}

export function PlaidFeature(props: PlaidFeatureProps) {
  return (
    <PlaidErrorBoundary>
      <PlaidFeatureContent {...props} />
    </PlaidErrorBoundary>
  );
}
