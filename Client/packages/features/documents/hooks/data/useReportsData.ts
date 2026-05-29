import { useCallback, useEffect, useMemo, useRef } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useFiltersQueryParams } from "packages/config/query/adapters";
import { queryKeys } from "packages/config/query/keys";
import { reportApi } from "packages/features/documents/api/report";
import { useAuthStore } from "packages/store";
import type { CompareReport, Report } from "packages/types";
import { dateNow, dayjs } from "packages/utils/date";
import { resolveApiResultErrorMessage } from "packages/utils/errorHandling";
import { getWindow } from "packages/utils/platform";

// Simple deserialization functions
const deserializeReport = (r: unknown): Report => {
  const reportData = r as {
    id: string;
    address: string;
    status: string;
    pdfUrl?: string;
    s3Key?: string;
    generatedAt?: number;
  };

  return {
    id: reportData.id,
    address: reportData.address,
    status: reportData.status as "completed" | "generating" | "error",
    pdfUrl: reportData.pdfUrl ?? null,
    s3Key: reportData.s3Key ?? null,
    generatedAt: dayjs(
      reportData.generatedAt ? reportData.generatedAt * 1000 : dateNow().valueOf()
    ).toDate(),
  };
};

const deserializeCompareReport = (r: unknown): CompareReport => {
  const reportData = r as {
    id: string;
    address: string;
    generatedAt?: number;
    status: string;
    pdfUrl?: string;
    s3Key?: string;
    price?: number;
    squareFootage?: number;
    yearBuilt?: number;
    propertyType?: string;
    estimatedValue?: number;
    neighborhoodScore?: number;
    schoolScore?: number;
  };

  return {
    id: reportData.id,
    address: reportData.address,
    generatedAt: dayjs(
      reportData.generatedAt ? reportData.generatedAt * 1000 : dateNow().valueOf()
    ).toDate(),
    status: reportData.status as "completed" | "generating" | "error",
    pdfUrl: reportData.pdfUrl ?? null,
    s3Key: reportData.s3Key ?? null,
    price: reportData.price,
    squareFootage: reportData.squareFootage,
    yearBuilt: reportData.yearBuilt,
    propertyType: reportData.propertyType,
    estimatedValue: reportData.estimatedValue,
    neighborhoodScore: reportData.neighborhoodScore,
    schoolScore: reportData.schoolScore,
  };
};

/**
 * Hook for managing reports data with React Query
 */
export const useReportsData = () => {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const filters = useFiltersQueryParams();

  // Memoize filters to prevent query key changes, but exclude page for reports
  // since reports don't need to refetch when navigating between properties
  const memoizedFilters = useMemo(() => {
    const { page: _page, ...reportsFilters } = filters;
    return reportsFilters;
  }, [filters]);

  // Use refs to store stable function references
  const refetchReportsRef = useRef<() => Promise<unknown>>();
  const refetchCompareReportsRef = useRef<() => Promise<unknown>>();

  // Always load reports data - removed location-based conditional loading
  const shouldLoadReports = true;

  // Gate on auth readiness - prevent queries before bootstrap completes
  const shouldLoadData = useMemo(() => {
    return shouldLoadReports && authReady && isAuthenticated;
  }, [shouldLoadReports, authReady, isAuthenticated]);

  const {
    data: rawReportsData,
    isLoading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = useQuery({
    queryKey: queryKeys.reports.list(memoizedFilters),
    queryFn: async () => {
      // API endpoint removed - return empty array
      return [];
    },
    enabled: false, // Disabled - endpoint removed
    // Ensure proper deduplication
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for this long
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch if data exists
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // Update refs when functions change
  useEffect(() => {
    refetchReportsRef.current = refetchReports;
  }, [refetchReports]);

  useEffect(() => {
    refetchCompareReportsRef.current = refetchReports; // Same function for both
  }, [refetchReports]);

  // Transform data for reports (memoized to avoid new references every render)
  const reportsData = useMemo(() => {
    return rawReportsData ? rawReportsData.map(deserializeReport) : [];
  }, [rawReportsData]);

  // Transform data for compare reports (memoized)
  const compareReportsQueryData = useMemo(() => {
    return rawReportsData ? rawReportsData.map(deserializeCompareReport) : [];
  }, [rawReportsData]);

  // Use the same loading and error states for both
  const compareReportsLoading = reportsLoading;
  const compareReportsError = reportsError;

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async ({ reportId, s3Key }: { reportId: string; s3Key?: string }) => {
      const response = await reportApi.delete(reportId, s3Key);
      if (!response.success) {
        throw new Error(resolveApiResultErrorMessage(response, "Failed to delete report"));
      }
      return response;
    },
    onMutate: ({ reportId }) => {
      // Optimistic update - remove the report from cache
      const previousReports = queryClient.getQueryData(queryKeys.reports.list(filters));
      queryClient.setQueryData(queryKeys.reports.list(filters), (old: Report[] | undefined) => {
        if (!old) return old;
        return old.filter((report) => report.id !== reportId);
      });
      return { previousReports };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousReports) {
        queryClient.setQueryData(queryKeys.reports.list(filters), context.previousReports);
      }
    },
    onSettled: () => {
      // Always refetch after mutation settles
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });

  // Share report mutation
  const shareReportMutation = useMutation({
    mutationFn: async ({
      documentId,
      documentName,
    }: {
      documentId: string;
      documentName: string;
    }) => {
      return await reportApi.shareDocument(documentId, documentName);
    },
  });

  // Compare reports mutation
  const compareReportsMutation = useMutation({
    mutationFn: async ({ reportIds, s3Keys }: { reportIds: string[]; s3Keys?: string[] }) => {
      const response = await reportApi.compare({
        report_ids: reportIds,
        s3Keys,
      });
      if (!response.success) {
        throw new Error(resolveApiResultErrorMessage(response, "Failed to compare reports"));
      }
      return response;
    },
  });

  // Get download URL mutation
  const getDownloadUrlMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await reportApi.getDownloadUrl(reportId);
      if (!response.success) {
        throw new Error(resolveApiResultErrorMessage(response, "Failed to get download URL"));
      }
      return response;
    },
  });

  // Get view URL mutation
  const getViewUrlMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await reportApi.getViewUrl(reportId);
      if (!response.success) {
        throw new Error(resolveApiResultErrorMessage(response, "Failed to get view URL"));
      }
      return response;
    },
  });

  // Listen for report generation events
  useEffect(() => {
    const handler = () => {
      if (shouldLoadData) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      }
    };

    const win = getWindow();
    if (win) {
      win.addEventListener("reportGenerated", handler);
      return () => win.removeEventListener("reportGenerated", handler);
    }
  }, [shouldLoadData, queryClient]);

  // Public methods - use refs to avoid dependency issues
  const refreshReports = useCallback(async () => {
    if (refetchReportsRef.current) {
      return await refetchReportsRef.current();
    }
  }, []); // No dependencies to prevent re-creation

  const refreshCompareReports = useCallback(async () => {
    if (refetchCompareReportsRef.current) {
      return await refetchCompareReportsRef.current();
    }
  }, []); // No dependencies to prevent re-creation

  const deleteReport = useCallback(
    async (reportId: string, s3Key?: string) => {
      return deleteReportMutation.mutateAsync({ reportId, s3Key });
    },
    [deleteReportMutation]
  );

  const shareReport = useCallback(
    async (documentId: string, documentName: string) => {
      return shareReportMutation.mutateAsync({ documentId, documentName });
    },
    [shareReportMutation]
  );

  const compareReportsData = useCallback(
    async (reportIds: string[], s3Keys?: string[]) => {
      return compareReportsMutation.mutateAsync({ reportIds, s3Keys });
    },
    [compareReportsMutation]
  );

  const getDownloadUrl = useCallback(
    async (reportId: string) => {
      return getDownloadUrlMutation.mutateAsync(reportId);
    },
    [getDownloadUrlMutation]
  );

  const getViewUrl = useCallback(
    async (reportId: string) => {
      return getViewUrlMutation.mutateAsync(reportId);
    },
    [getViewUrlMutation]
  );

  return {
    // State
    reports: reportsData ?? [],
    reportsLoading,
    reportsError: reportsError?.message ?? null,
    compareReports: compareReportsQueryData ?? [],
    compareReportsLoading,
    compareReportsError: compareReportsError?.message ?? null,

    // Methods
    refreshReports,
    refreshCompareReports,
    deleteReport,
    shareReport,
    compareReportsData,
    getDownloadUrl,
    getViewUrl,
  };
};
