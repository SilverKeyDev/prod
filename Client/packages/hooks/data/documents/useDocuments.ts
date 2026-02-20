import { useCallback, useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { log, LOG_CATEGORIES } from "logger";

import { useFiltersQueryParams } from "packages/config/query/adapters";
import { queryKeys } from "packages/config/query/keys";
import type { Document } from "packages/schemas";
import { documentService } from "packages/services";
import { useAuthStore } from "packages/store";

type UploadEntry = {
  id: string;
  file: File;
  progress: number;
  status: string;
};

export const useDocuments = () => {
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const queryClient = useQueryClient();
  const filters = useFiltersQueryParams();

  // Upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadEntry[]>([]);

  // Only load documents data on pages that need it
  // For now, always load documents since we don't have a forms page yet
  const shouldLoadDocuments = true;

  // Documents query - disabled, getDocuments should not be called
  const {
    data: documentsResponse,
    isLoading: documentsLoading,
    error: documentsError,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: queryKeys.documents.list(filters),
    queryFn: async () => {
      // getDocuments should not be called - return empty array
      return [];
    },
    enabled: false, // Disabled - getDocuments should not be called
    select: (data) => data,
    // Ensure proper deduplication
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for this long
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch if data exists
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // Extract documents data from response
  const documentsData = useMemo(
    () => documentsResponse ?? [],
    [documentsResponse],
  );

  // Categories query
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: queryKeys.documents.categories(),
    queryFn: async () => {
      try {
        const categoriesData = await documentService.fetchCategories();
        return categoriesData;
      } catch {
        // If categories endpoint doesn't exist, return empty array
        log.warn(
          LOG_CATEGORIES.API,
          "Categories endpoint not available, returning empty array",
        );
        return [];
      }
    },
    enabled: shouldLoadDocuments && authReady && !!user?.id,
    select: (data) => data,
    // Ensure proper deduplication
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for this long
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch if data exists
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({
      file,
      category,
      propertyId,
      offerId,
      address,
    }: {
      file: File;
      category: string;
      propertyId?: string;
      offerId?: string;
      address?: string;
    }) => {
      const newDocument = await documentService.uploadDocument(
        file,
        category,
        propertyId,
        offerId,
        address,
      );
      return newDocument;
    },
    onSuccess: () => {
      // Invalidate documents after successful upload
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
  });

  // Update document status mutation
  const updateDocumentStatusMutation = useMutation({
    mutationFn: async ({
      docId,
      status,
    }: {
      docId: string;
      status: Document["status"];
    }) => {
      const updatedDocument = await documentService.updateDocumentStatus(
        docId,
        status,
      );
      return updatedDocument;
    },
    onSuccess: (updatedDocument) => {
      // Optimistically update the document in cache
      queryClient.setQueryData(
        queryKeys.documents.list(),
        (old: Document[] | undefined) => {
          if (!old) return old;
          return old.map((doc) =>
            doc.id === updatedDocument.id ? updatedDocument : doc,
          );
        },
      );
    },
  });

  // Sign document mutation
  const signDocumentMutation = useMutation({
    mutationFn: async (docId: string) => {
      const signedDocument = await documentService.signDocument(docId);
      return signedDocument;
    },
    onSuccess: (signedDocument) => {
      // Optimistically update the document in cache
      queryClient.setQueryData(
        queryKeys.documents.list(),
        (old: Document[] | undefined) => {
          if (!old) return old;
          return old.map((doc) =>
            doc.id === signedDocument.id ? signedDocument : doc,
          );
        },
      );
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId: string) => {
      await documentService.deleteDocument(docId);
      return docId;
    },
    onMutate: (docId) => {
      // Optimistic update - remove the document from cache
      const previousDocuments = queryClient.getQueryData(
        queryKeys.documents.list(),
      );
      queryClient.setQueryData(
        queryKeys.documents.list(),
        (old: Document[] | undefined) => {
          if (!old) return old;
          return old.filter((doc) => doc.id !== docId);
        },
      );
      return { previousDocuments };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousDocuments) {
        queryClient.setQueryData(
          queryKeys.documents.list(),
          context.previousDocuments,
        );
      }
    },
    onSettled: () => {
      // Always refetch after mutation settles
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
  });

  // Download document mutation
  const downloadDocumentMutation = useMutation({
    mutationFn: async (docId: string) => {
      return await documentService.downloadDocument(docId);
    },
  });

  /* =========================
     Document Operations
     ========================= */

  const uploadDocument = useCallback(
    async (
      file: File,
      category: string,
      propertyId?: string,
      offerId?: string,
      address?: string,
    ): Promise<Document> => {
      // Create upload tracking entry
      const uploadId = `${Date.now()}-${file.name}`;
      const uploadEntry: {
        id: string;
        file: File;
        progress: number;
        status: string;
      } = {
        id: uploadId,
        file,
        progress: 0,
        status: "uploading",
      };
      setUploadedFiles((prev) => [...prev, uploadEntry]);

      try {
        const newDocument = await uploadDocumentMutation.mutateAsync({
          file,
          category,
          propertyId,
          offerId,
          address,
        });

        // Update upload status to completed
        setUploadedFiles((prev) =>
          prev.map((upload) =>
            upload.id === uploadId
              ? { ...upload, status: "completed", progress: 100 }
              : upload,
          ),
        );

        return newDocument;
      } catch (error: unknown) {
        // Update upload status to failed
        setUploadedFiles((prev) =>
          prev.map((upload) =>
            upload.id === uploadId
              ? { ...upload, status: "failed", progress: 0 }
              : upload,
          ),
        );
        throw error;
      }
    },
    [uploadDocumentMutation],
  );

  const updateDocumentStatus = useCallback(
    async (docId: string, status: Document["status"]): Promise<void> => {
      await updateDocumentStatusMutation.mutateAsync({ docId, status });
    },
    [updateDocumentStatusMutation],
  );

  const signDocument = useCallback(
    async (docId: string): Promise<void> => {
      await signDocumentMutation.mutateAsync(docId);
    },
    [signDocumentMutation],
  );

  const downloadDocument = useCallback(
    async (docId: string): Promise<void> => {
      return downloadDocumentMutation.mutateAsync(docId);
    },
    [downloadDocumentMutation],
  );

  const deleteDocument = useCallback(
    async (docId: string): Promise<void> => {
      await deleteDocumentMutation.mutateAsync(docId);
    },
    [deleteDocumentMutation],
  );

  /* =========================
     Public Functions
     ========================= */

  // Helper functions
  const getDocumentsByCategory = useCallback(
    (category: string) =>
      documentService.getDocumentsByCategory(documentsData ?? [], category),
    [documentsData],
  );

  const getDocumentsByProperty = useCallback(
    (propertyId: string) =>
      documentService.getDocumentsByProperty(documentsData ?? [], propertyId),
    [documentsData],
  );

  const getDocumentsByOffer = useCallback(
    (offerId: string) =>
      documentService.getDocumentsByOffer(documentsData ?? [], offerId),
    [documentsData],
  );

  // Note: Cross-tab auth changes are no longer tracked via sessionStorage tokens
  // Authentication state is managed via HTTP-only cookies
  // The AuthContext handles cross-tab auth changes via custom events if needed

  // Cleanup completed uploads after 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setUploadedFiles((prev) =>
        prev.filter(
          (upload) =>
            upload.status === "uploading" ||
            Date.now() - parseInt(upload.id.split("-")[0]) < 5 * 60 * 1000,
        ),
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    documents: documentsData ?? [],
    documentCategories: categoriesData ?? [],
    uploadedFiles,
    documentsLoading,
    categoriesLoading,
    documentsError: documentsError?.message ?? null,
    categoriesError: categoriesError?.message ?? null,
    uploadDocument,
    deleteDocument,
    updateDocumentStatus,
    signDocument,
    downloadDocument,
    refreshDocuments: refetchDocuments,
    refreshCategories: refetchCategories,
    getDocumentsByCategory,
    getDocumentsByProperty,
    getDocumentsByOffer,
  };
};
