import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { docusignApi } from "packages/features/documents/api/docusign";
import { dateNow } from "packages/utils/date";
import { createFile, setPlatformGlobals } from "packages/utils/platform";

import { useDocusignActions } from "./useDocusignActions";

vi.mock("packages/features/documents/api/docusign");
vi.mock("packages/logger", () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    security: vi.fn(),
  },
  LOG_CATEGORIES: {
    API: "api",
    DOCUSIGN: "docusign",
    ERRORS: "errors",
  },
}));

describe("useDocusignActions (void, signing URL, revision, sync, cache)", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    const gt = globalThis as unknown as {
      File?: unknown;
      Blob?: unknown;
      fetch?: typeof fetch;
    };
    setPlatformGlobals({
      window: null,
      document: null,
      navigator: null,
      File: gt.File as never,
      Blob: gt.Blob as never,
      fetch:
        typeof globalThis !== "undefined" && "fetch" in globalThis
          ? gt.fetch
          : undefined,
    });
  });

  afterEach(() => {
    queryClient?.clear();
  });

  describe("voidAgreement", () => {
    it("should void agreement with reason", async () => {
      const mockResponse = {
        success: true,
        agreement_id: "agreement-123",
        status: "voided",
      };

      vi.mocked(docusignApi.voidAgreement).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDocusignActions(), {
        wrapper: createWrapper(),
      });

      const response = await result.current.voidAgreement({
        agreementId: "agreement-123",
        reason: "No longer needed",
      });

      expect(response).toEqual(mockResponse);
      expect(docusignApi.voidAgreement).toHaveBeenCalledWith("agreement-123", {
        reason: "No longer needed",
      });
    });

    it("should void without reason", async () => {
      const mockResponse = {
        success: true,
        agreement_id: "agreement-123",
        status: "voided",
      };

      vi.mocked(docusignApi.voidAgreement).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDocusignActions(), {
        wrapper: createWrapper(),
      });

      await result.current.voidAgreement({
        agreementId: "agreement-123",
      });

      expect(docusignApi.voidAgreement).toHaveBeenCalledWith(
        "agreement-123",
        {},
      );
    });
  });

  describe("getSigningUrl", () => {
    it("should retrieve signing URL for participant", async () => {
      const mockUrl = "https://docusign.com/signing/abcd1234";

      vi.mocked(docusignApi.getSigningUrl).mockResolvedValue({
        success: true,
        signing_url: mockUrl,
      });

      const { result } = renderHook(() => useDocusignActions(), {
        wrapper: createWrapper(),
      });

      const url = await result.current.getSigningUrl({
        agreementId: "agreement-123",
        participantId: "participant-456",
      });

      expect(url).toBe(mockUrl);
      expect(docusignApi.getSigningUrl).toHaveBeenCalledWith("agreement-123", {
        participant_id: "participant-456",
      });
    });

    it("should handle missing signing URL", async () => {
      vi.mocked(docusignApi.getSigningUrl).mockResolvedValue({
        success: false,
        error: "Participant not found",
      });

      const { result } = renderHook(() => useDocusignActions(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.getSigningUrl({
          agreementId: "agreement-123",
          participantId: "invalid-participant",
        }),
      ).rejects.toThrow();
    });
  });

  describe("createRevision", () => {
    it("should create revision with file", async () => {
      const mockFile = createFile(["content"], "document.pdf", {
        type: "application/pdf",
      });
      const mockRevision = {
        id: "revision-123",
        agreement_id: "agreement-123",
        version: 2,
        created_at: dateNow().toISOString(),
      };

      vi.mocked(docusignApi.createRevision).mockResolvedValue({
        success: true,
        revision: mockRevision,
      });

      const { result } = renderHook(() => useDocusignActions(), {
        wrapper: createWrapper(),
      });

      const revision = await result.current.createRevision({
        agreementId: "agreement-123",
        file: mockFile,
        notes: "Updated document",
      });

      expect(revision).toEqual(mockRevision);
      expect(docusignApi.createRevision).toHaveBeenCalledWith(
        "agreement-123",
        mockFile,
        "Updated document",
      );
    });

    it("should track revision creation state", async () => {
      const mockFile = createFile(["content"], "document.pdf", {
        type: "application/pdf",
      });

      vi.mocked(docusignApi.createRevision).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                revision: {
                  id: "revision-123",
                  agreement_id: "agreement-123",
                  version: 2,
                  created_at: "",
                },
              });
            }, 100);
          }),
      );

      const { result } = renderHook(() => useDocusignActions(), {
        wrapper: createWrapper(),
      });

      const revisionPromise = result.current.createRevision({
        agreementId: "agreement-123",
        file: mockFile,
      });

      await waitFor(() => {
        expect(result.current.isCreatingRevision).toBe(true);
      });

      await revisionPromise;

      await waitFor(() => {
        expect(result.current.isCreatingRevision).toBe(false);
      });
    });
  });

  describe("syncTemplates", () => {
    it("should sync templates from DocuSign", async () => {
      const mockResponse = {
        success: true,
        templates: [
          { id: "template-1", name: "Purchase Agreement" },
          { id: "template-2", name: "Lease Agreement" },
        ],
        synced_count: 2,
      };

      vi.mocked(docusignApi.syncTemplates).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDocusignActions(), {
        wrapper: createWrapper(),
      });

      const response = await result.current.syncTemplates();

      expect(response).toEqual(mockResponse);
      expect(docusignApi.syncTemplates).toHaveBeenCalled();
    });

    it("should track sync state", async () => {
      vi.mocked(docusignApi.syncTemplates).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ success: true, templates: [], synced_count: 0 });
            }, 100);
          }),
      );

      const { result } = renderHook(() => useDocusignActions(), {
        wrapper: createWrapper(),
      });

      const syncPromise = result.current.syncTemplates();

      await waitFor(() => {
        expect(result.current.isSyncingTemplates).toBe(true);
      });

      await syncPromise;

      await waitFor(() => {
        expect(result.current.isSyncingTemplates).toBe(false);
      });
    });
  });

  describe("cache invalidation", () => {
    it("should invalidate agreements cache after create", async () => {
      vi.mocked(docusignApi.createAgreement).mockResolvedValue({
        success: true,
        agreement: {
          id: "agreement-123",
          name: "Test",
          status: "draft",
          participants: [],
          created_at: "",
          updated_at: "",
        },
      });

      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDocusignActions(), {
        wrapper,
      });

      await result.current.createAgreement({
        name: "Test",
        template_id: "template-123",
        participants: [],
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalled();
      });
    });

    it("should invalidate templates cache after sync", async () => {
      vi.mocked(docusignApi.syncTemplates).mockResolvedValue({
        success: true,
        templates: [],
        synced_count: 0,
      });

      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDocusignActions(), {
        wrapper,
      });

      await result.current.syncTemplates();

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalled();
      });
    });
  });
});
