/**
 * Plaid Feature Exports
 * Centralized exports for all Plaid-related components and functionality
 */

// Main feature component
export { PlaidFeature } from './PlaidFeature';

// Components
export { PlaidConnectionCard } from '../../components/cards/PlaidConnectionCard';
export { PlaidLinkModal } from '../../components/modals/PlaidLinkModal';
export { PlaidStatusWidget } from '../../components/widgets/PlaidStatusWidget';

// Error Handling
export { PlaidErrorBoundary, withPlaidErrorBoundary, usePlaidErrorHandler } from '../../components/error/PlaidErrorBoundary';

// Hooks
export {
  usePlaidIntegration,
  useHasConnectedAccounts,
  useLatestAssetReport,
  usePlaidStoreState,
  usePlaidStoreActions,
} from '../../core/hooks/data/usePlaidIntegration';

export {
  usePlaidItems,
  usePlaidLinkToken,
  usePlaidAssetReports,
  usePlaidAssetReport,
  usePlaidStatements,
  usePlaidTokenExchange,
  usePlaidItemDisconnect,
} from '../../core/hooks/data/usePlaid';

// Services
export { plaidService, plaidApi, plaidUtils } from '../../core/services/plaid';

// Store
export { usePlaidStore } from '../../core/store/plaid.slice';

// Types
export type {
  PlaidItem,
  PlaidAssetReport,
  PlaidStatement,
  PlaidLinkToken,
  PlaidAssetReportData,
  PlaidAccount,
  PlaidOwner,
  PlaidAddress,
  PlaidEmail,
  PlaidPhone,
  CreateLinkTokenRequest,
  ExchangeTokenRequest,
  CreateAssetReportRequest,
  ApiResponse,
  PlaidLinkConfig,
  PlaidProduct,
  PlaidEnvironment,
  PlaidStatus,
} from '../../core/schemas/plaid';
