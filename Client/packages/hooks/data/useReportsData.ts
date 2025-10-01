import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";

import { useAuthStore } from "../../store/auth.slice";
import { reportApi } from "../../config/api/report";
import { useFiltersQueryParams } from "../../config/query/adapters";
import { queryKeys } from "../../config/query/keys";
import type { Report, CompareReport } from "../../schemas";

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
    generatedAt: new Date(
      reportData.generatedAt ? reportData.generatedAt * 1000 : Date.now(),
    ),
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
    generatedAt: new Date(
      reportData.generatedAt ? reportData.generatedAt * 1000 : Date.now(),
    ),
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
  const location = useLocation();

  // Memoize filters to prevent query key changes
  const memoizedFilters = useMemo(() => filters, [filters]);

  // Use refs to store stable function references
  const refetchReportsRef = useRef<() => Promise<unknown>>();
  const refetchCompareReportsRef = useRef<() => Promise<unknown>>();

  // Only load reports data on pages that need it
  const shouldLoadReports = useMemo(() => {
    const path = location.pathname;
    return (
      path.startsWith("/dashboard") ||
      path.startsWith("/reports") ||
      path.startsWith("/generate-report") ||
      path.startsWith("/compare-reports") ||
      path.startsWith("/ai-assistant")
    );
  }, [location.pathname]);

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
      // Only log once per session to avoid spam
      if (!sessionStorage.getItem("reports_fetch_logged")) {
        sessionStorage.setItem("reports_fetch_logged", "true");
      }
      const response = await reportApi.getAll();
      if (!response.success || !response.reports) {
        throw new Error(response.error ?? "Failed to fetch reports");
      }
      // Only log once per session to avoid spam
      if (!sessionStorage.getItem("reports_loaded_logged")) {
        sessionStorage.setItem("reports_loaded_logged", "true");
      }
      return response.reports;
    },
    enabled: shouldLoadData,
    // Ensure proper deduplication
    staleTime: 3 * 60 * 1000, // 3 minutes - data is fresh for this long
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch if data exists
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

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (data: {
      address: string;
      comparisonAddress?: string;
      user_id?: string;
      marketing_model?: boolean;
    }) => {
      const response = await reportApi.generate(data);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to generate report");
      }
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch reports after successful generation
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async ({
      reportId,
      s3Key,
    }: {
      reportId: string;
      s3Key?: string;
    }) => {
      const response = await reportApi.delete(reportId, s3Key);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to delete report");
      }
      return response;
    },
    onMutate: ({ reportId }) => {
      // Optimistic update - remove the report from cache
      const previousReports = queryClient.getQueryData(
        queryKeys.reports.list(filters),
      );
      queryClient.setQueryData(
        queryKeys.reports.list(filters),
        (old: Report[] | undefined) => {
          if (!old) return old;
          return old.filter((report) => report.id !== reportId);
        },
      );
      return { previousReports };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousReports) {
        queryClient.setQueryData(
          queryKeys.reports.list(filters),
          context.previousReports,
        );
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
    mutationFn: async ({
      reportIds,
      s3Keys,
    }: {
      reportIds: string[];
      s3Keys?: string[];
    }) => {
      const response = await reportApi.compare({
        report_ids: reportIds,
        s3Keys,
      });
      if (!response.success) {
        throw new Error(response.error ?? "Failed to compare reports");
      }
      return response;
    },
  });

  // Get download URL mutation
  const getDownloadUrlMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await reportApi.getDownloadUrl(reportId);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to get download URL");
      }
      return response;
    },
  });

  // Get view URL mutation
  const getViewUrlMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await reportApi.getViewUrl(reportId);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to get view URL");
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

    window.addEventListener("reportGenerated", handler);
    return () => window.removeEventListener("reportGenerated", handler);
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

  const generateReport = useCallback(
    async (data: {
      address: string;
      comparisonAddress?: string;
      user_id?: string;
      marketing_model?: boolean;
    }) => {
      return generateReportMutation.mutateAsync(data);
    },
    [generateReportMutation],
  );

  const deleteReport = useCallback(
    async (reportId: string, s3Key?: string) => {
      return deleteReportMutation.mutateAsync({ reportId, s3Key });
    },
    [deleteReportMutation],
  );

  const shareReport = useCallback(
    async (documentId: string, documentName: string) => {
      return shareReportMutation.mutateAsync({ documentId, documentName });
    },
    [shareReportMutation],
  );

  const compareReportsData = useCallback(
    async (reportIds: string[], s3Keys?: string[]) => {
      return compareReportsMutation.mutateAsync({ reportIds, s3Keys });
    },
    [compareReportsMutation],
  );

  const getDownloadUrl = useCallback(
    async (reportId: string) => {
      return getDownloadUrlMutation.mutateAsync(reportId);
    },
    [getDownloadUrlMutation],
  );

  const getViewUrl = useCallback(
    async (reportId: string) => {
      return getViewUrlMutation.mutateAsync(reportId);
    },
    [getViewUrlMutation],
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
    generateReport,
    deleteReport,
    shareReport,
    compareReportsData,
    getDownloadUrl,
    getViewUrl,
  };
};
