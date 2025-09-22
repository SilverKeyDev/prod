/**
 * Plaid Data Hooks
 * TanStack Query hooks for Plaid API operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { plaidService } from '../../services/plaid';
import type { PlaidItem, PlaidAssetReport, PlaidStatement, PlaidAssetReportData } from '../../schemas/plaid';
import { queryKeys } from '../../config/query/keys';
import { useAuth } from '../../contexts';

// Types
export interface UsePlaidItemsReturn {
  plaidItems: PlaidItem[];
  plaidItemsLoading: boolean;
  plaidItemsError: string | null;
  refetchPlaidItems: () => Promise<void>;
}

export interface UsePlaidLinkTokenReturn {
  linkToken: string | null;
  linkTokenLoading: boolean;
  linkTokenError: string | null;
  createLinkToken: (products?: string[]) => Promise<void>;
}

export interface UsePlaidAssetReportsReturn {
  assetReports: PlaidAssetReport[];
  assetReportsLoading: boolean;
  assetReportsError: string | null;
  createAssetReport: (days?: number) => Promise<string | null>;
  refetchAssetReports: () => Promise<void>;
}

export interface UsePlaidAssetReportReturn {
  assetReport: PlaidAssetReportData | null;
  assetReportLoading: boolean;
  assetReportError: string | null;
  refetchAssetReport: () => Promise<void>;
  downloadAssetReportPdf: () => Promise<void>;
}

export interface UsePlaidStatementsReturn {
  statements: PlaidStatement[];
  statementsLoading: boolean;
  statementsError: string | null;
  refetchStatements: () => Promise<void>;
  downloadStatement: (statementId: string) => Promise<void>;
}

// Hooks

/**
 * Get user's linked Plaid items
 */
export function usePlaidItems(): UsePlaidItemsReturn {
  const { authReady, user } = useAuth();
  
  const {
    data: plaidItems = [],
    isLoading: plaidItemsLoading,
    error: plaidItemsError,
    refetch: refetchPlaidItemsQuery,
  } = useQuery({
    queryKey: queryKeys.plaid.items(),
    queryFn: async () => {
      const response = await plaidService.getItems();
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to fetch plaid items');
      }
      return response.data || [];
    },
    enabled: authReady && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const refetchPlaidItems = useCallback(async () => {
    await refetchPlaidItemsQuery();
  }, [refetchPlaidItemsQuery]);

  return {
    plaidItems,
    plaidItemsLoading,
    plaidItemsError: plaidItemsError?.message ?? null,
    refetchPlaidItems,
  };
}

/**
 * Create and manage Plaid Link tokens
 */
export function usePlaidLinkToken(): UsePlaidLinkTokenReturn {
  const { authReady, user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: linkTokenData,
    isLoading: linkTokenLoading,
    error: linkTokenError,
  } = useQuery({
    queryKey: queryKeys.plaid.linkToken(),
    queryFn: async () => {
      const response = await plaidService.createLinkToken();
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to create link token');
      }
      return response.data;
    },
    enabled: authReady && !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const createLinkTokenMutation = useMutation({
    mutationFn: async (products?: string[]) => {
      const response = await plaidService.createLinkToken({ products });
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to create link token');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.plaid.linkToken(), data);
    },
    // Don't retry Plaid mutations to prevent infinite loops
    retry: 0,
    // Add retry delay to prevent rapid retries
    retryDelay: 5000,
  });

  const createLinkToken = useCallback(async (products?: string[]) => {
    await createLinkTokenMutation.mutateAsync(products);
  }, [createLinkTokenMutation]);

  return {
    linkToken: linkTokenData?.link_token ?? null,
    linkTokenLoading: linkTokenLoading || createLinkTokenMutation.isPending,
    linkTokenError: linkTokenError?.message ?? createLinkTokenMutation.error?.message ?? null,
    createLinkToken,
  };
}

/**
 * Exchange public token for access token
 */
export function usePlaidTokenExchange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (publicToken: string) => {
      const response = await plaidService.exchangePublicToken({ public_token: publicToken });
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to exchange public token');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch plaid items after successful exchange
      void queryClient.invalidateQueries({ queryKey: queryKeys.plaid.items() });
    },
    // Don't retry Plaid mutations to prevent infinite loops
    retry: 0,
    retryDelay: 5000,
  });
}

/**
 * Create asset reports for proof of funds
 */
export function usePlaidAssetReports(): UsePlaidAssetReportsReturn {
  const { authReady, user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: assetReports = [],
    isLoading: assetReportsLoading,
    error: assetReportsError,
    refetch: refetchAssetReportsQuery,
  } = useQuery({
    queryKey: queryKeys.plaid.assetReports(),
    queryFn: async () => {
      // Note: This would need a backend endpoint to list user's asset reports
      // For now, we'll return empty array
      return [];
    },
    enabled: authReady && !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const createAssetReportMutation = useMutation({
    mutationFn: async (days?: number) => {
      const response = await plaidService.createAssetReport({ days });
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to create asset report');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate asset reports to refetch the list
      void queryClient.invalidateQueries({ queryKey: queryKeys.plaid.assetReports() });
      return data?.asset_report_token ?? null;
    },
    // Don't retry Plaid mutations to prevent infinite loops
    retry: 0,
    retryDelay: 5000,
  });

  const createAssetReport = useCallback(async (days?: number): Promise<string | null> => {
    const result = await createAssetReportMutation.mutateAsync(days);
    return result?.asset_report_token ?? null;
  }, [createAssetReportMutation]);

  const refetchAssetReports = useCallback(async () => {
    await refetchAssetReportsQuery();
  }, [refetchAssetReportsQuery]);

  return {
    assetReports,
    assetReportsLoading: assetReportsLoading || createAssetReportMutation.isPending,
    assetReportsError: assetReportsError?.message ?? createAssetReportMutation.error?.message ?? null,
    createAssetReport,
    refetchAssetReports,
  };
}

/**
 * Get specific asset report data
 */
export function usePlaidAssetReport(assetReportToken: string | null): UsePlaidAssetReportReturn {
  const {
    data: assetReport,
    isLoading: assetReportLoading,
    error: assetReportError,
    refetch: refetchAssetReportQuery,
  } = useQuery({
    queryKey: queryKeys.plaid.assetReport(assetReportToken || ''),
    queryFn: async () => {
      if (!assetReportToken) return null;
      const response = await plaidService.getAssetReport(assetReportToken);
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to fetch asset report');
      }
      return response.data;
    },
    enabled: !!assetReportToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const refetchAssetReport = useCallback(async () => {
    await refetchAssetReportQuery();
  }, [refetchAssetReportQuery]);

  const downloadAssetReportPdf = useCallback(async () => {
    if (!assetReportToken) return;
    
    try {
      const blob = await plaidService.getAssetReportPdf(assetReportToken);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'proof_of_funds.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download asset report PDF:', error);
      throw error;
    }
  }, [assetReportToken]);

  return {
    assetReport: assetReport ?? null,
    assetReportLoading,
    assetReportError: assetReportError?.message ?? null,
    refetchAssetReport,
    downloadAssetReportPdf,
  };
}

/**
 * List and download bank statements
 */
export function usePlaidStatements(accountId?: string): UsePlaidStatementsReturn {
  const { authReady, user } = useAuth();

  const {
    data: statementsData,
    isLoading: statementsLoading,
    error: statementsError,
    refetch: refetchStatementsQuery,
  } = useQuery({
    queryKey: queryKeys.plaid.statementsList(accountId),
    queryFn: async () => {
      const response = await plaidService.listStatements(accountId);
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to fetch statements');
      }
      return response.data?.statements || [];
    },
    enabled: authReady && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const refetchStatements = useCallback(async () => {
    await refetchStatementsQuery();
  }, [refetchStatementsQuery]);

  const downloadStatement = useCallback(async (statementId: string) => {
    try {
      const blob = await plaidService.downloadStatement(statementId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `statement_${statementId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download statement:', error);
      throw error;
    }
  }, []);

  return {
    statements: statementsData || [],
    statementsLoading,
    statementsError: statementsError?.message ?? null,
    refetchStatements,
    downloadStatement,
  };
}

/**
 * Disconnect a Plaid item
 */
export function usePlaidItemDisconnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const response = await plaidService.disconnectItem(itemId);
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to disconnect item');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch plaid items after successful disconnect
      void queryClient.invalidateQueries({ queryKey: queryKeys.plaid.items() });
    },
  });
}
