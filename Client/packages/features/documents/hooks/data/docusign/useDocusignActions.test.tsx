import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { docusignApi } from "packages/features/documents/api/docusign";
import type { Agreement, CreateAgreementRequest } from "packages/features/documents/types/docusign";
import { dateNow } from "packages/utils/date";
import { setPlatformGlobals } from "packages/utils/platform";

import { useDocusignActions } from "./useDocusignActions";

// Mock dependencies
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

describe("useDocusignActions", () => {
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
      fetch: typeof globalThis !== "undefined" && "fetch" in globalThis ? gt.fetch : undefined,
    });
  });

  afterEach(() => {
    queryClient?.clear();
  });

  describe("createAgreement", () => {
    it("should create agreement successfully", async () => {
      const mockAgreement: Agreement = {
        id: "agreement-123",
        name: "Test Agreement",
        status: "draft",
        participants: [],
        created_at: dateNow().toISOString(),
        updated_at: dateNow().toISOString(),
      };

      vi.mocked(docusignApi.createAgreement).mockResolvedValue({
        success: true,
        agreement: mockAgreement,
      });

      const { result } = renderHook(() => useDocusignActions(), {
        wrapper: createWrapper(),
      });

      const request: CreateAgreementRequest = {
        name: "Test Agreement",
        template_id: "template-123",
        participants: [
          {
            email: "signer@example.com",
            name: "Test Signer",
            role: "signer",
          },
        ],
      };

      const agreement = await result.current.createAgreement(request);

      expect(agreement).toEqual(mockAgreement);
      expect(docusignApi.createAgreement).toHaveBeenCalledWith(request);
    });

    it("should track loading state during creation", async () => {
      vi.mocked(docusignApi.createAgreement).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
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
            }, 100);
          })
      );

      const { result } = renderHook(() => useDocusignActions(), {
        wrapper: createWrapper(),
      });

      const createPromise = result.current.createAgreement({
        name: "Test",
        template_id: "template-123",
        participants: [],
      });

      await waitFor(() => {
        expect(result.current.isCreatingAgreement).toBe(true);
      });

      await createPromise;

      await waitFor(() => {
        expect(result.current.isCreatingAgreement).toBe(false);
      });
    });

    it("should handle create agreement error", async () => {
      vi.mocked(docusignApi.createAgreement).mockResolvedValue({
        success: false,
        error: "Template not found",
      });

      const { result } = renderHook(() => useDocusignActions(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.createAgreement({
          name: "Test",
          template_id: "invalid-template",
          participants: [],
        })
      ).rejects.toThrow();
    });
  });

  describe("sendAgreement", () => {
    it("should send agreement for signing", async () => {
      const mockResponse = {
        success: true,
        agreement_id: "agreement-123",
        status: "sent",
      };

      vi.mocked(docusignApi.sendAgreement).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDocusignActions(), {
        wrapper: createWrapper(),
      });

      const response = await result.current.sendAgreement({
        agreementId: "agreement-123",
        signing_method: "email",
      });

      expect(response).toEqual(mockResponse);
      expect(docusignApi.sendAgreement).toHaveBeenCalledWith("agreement-123", {
        signing_method: "email",
      });
    });

    it("should send with embedded signing method", async () => {
      const mockResponse = {
        success: true,
        agreement_id: "agreement-123",
        status: "sent",
      };

      vi.mocked(docusignApi.sendAgreement).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDocusignActions(), {
        wrapper: createWrapper(),
      });

      await result.current.sendAgreement({
        agreementId: "agreement-123",
        signing_method: "embedded",
      });

      expect(docusignApi.sendAgreement).toHaveBeenCalledWith("agreement-123", {
        signing_method: "embedded",
      });
    });

    it("should track sending state", async () => {
      vi.mocked(docusignApi.sendAgreement).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                agreement_id: "agreement-123",
                status: "sent",
              });
            }, 100);
          })
      );

      const { result } = renderHook(() => useDocusignActions(), {
        wrapper: createWrapper(),
      });

      const sendPromise = result.current.sendAgreement({
        agreementId: "agreement-123",
      });

      await waitFor(() => {
        expect(result.current.isSendingAgreement).toBe(true);
      });

      await sendPromise;

      await waitFor(() => {
        expect(result.current.isSendingAgreement).toBe(false);
      });
    });
  });
});
