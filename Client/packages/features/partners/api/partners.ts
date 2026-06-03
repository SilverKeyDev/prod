import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from "packages/services/http";
import type { components } from "packages/types/api.generated";
import type { Workspace } from "packages/utils/workspace";

export type Partner = components["schemas"]["Partner"];
export type PartnerCreateRequest = components["schemas"]["PartnerCreateRequest"];
export type PartnerUpdateRequest = components["schemas"]["PartnerUpdateRequest"];
export type RevShareAnalyticsData = components["schemas"]["RevShareAnalyticsResponse"]["data"];

type PartnerListResponse = components["schemas"]["PartnerListResponse"];
type PartnerResponse = components["schemas"]["PartnerResponse"];
type RevShareAnalyticsResponse = components["schemas"]["RevShareAnalyticsResponse"];
type RevSharePlacementsResponse = components["schemas"]["RevSharePlacementsResponse"];

export type PartnerPlacement = RevSharePlacementsResponse["data"]["placements"][number];

export type ChecklistStepOption = {
  step_id: string;
  section: string;
  item_id: number;
  label: string;
  component_key?: string;
};

export const partnersApi = {
  listPartners: async (): Promise<Partner[]> => {
    const res = await apiGet<PartnerListResponse>("/api/v1/admin/partners");
    if (!res.success || !res.data?.partners) {
      throw new Error("Failed to load partners");
    }
    return res.data.partners;
  },

  createPartner: async (body: PartnerCreateRequest): Promise<Partner> => {
    const res = await apiPost<PartnerResponse, PartnerCreateRequest>(
      "/api/v1/admin/partners",
      body
    );
    if (!res.success || !res.data) {
      throw new Error("Failed to create partner");
    }
    return res.data;
  },

  updatePartner: async (partnerId: string, body: PartnerUpdateRequest): Promise<Partner> => {
    const res = await apiPatch<PartnerResponse, PartnerUpdateRequest>(
      `/api/v1/admin/partners/${partnerId}`,
      body
    );
    if (!res.success || !res.data) {
      throw new Error("Failed to update partner");
    }
    return res.data;
  },

  deletePartner: async (partnerId: string): Promise<void> => {
    const res = await apiDelete<{ success: boolean }>(`/api/v1/admin/partners/${partnerId}`);
    if (!res.success) {
      throw new Error("Failed to delete partner");
    }
  },

  listChecklistSteps: async (): Promise<ChecklistStepOption[]> => {
    const res = await apiGet<{
      success: boolean;
      data?: { steps?: ChecklistStepOption[] };
    }>("/api/v1/admin/partners/checklist-steps");
    return res.data?.steps ?? [];
  },

  getAnalytics: async (query: Record<string, string>): Promise<RevShareAnalyticsData> => {
    const qs = new URLSearchParams(query).toString();
    const res = await apiGet<RevShareAnalyticsResponse>(`/api/v1/admin/rev-share/analytics?${qs}`);
    if (!res.success || !res.data) {
      throw new Error("Failed to load analytics");
    }
    return res.data;
  },

  getPlacements: async (
    stepId: string,
    workspace: Workspace,
    transactionId?: string
  ): Promise<PartnerPlacement[]> => {
    const qs = new URLSearchParams({
      step_id: stepId,
      workspace,
    });
    if (transactionId) {
      qs.set("transaction_id", transactionId);
    }
    const res = await apiGet<RevSharePlacementsResponse>(
      `/api/v1/partners/placements?${qs.toString()}`
    );
    if (!res.success || !res.data?.placements) {
      return [];
    }
    return res.data.placements;
  },

  uploadPartnerLogo: async (
    partnerId: string,
    file: File
  ): Promise<{ logo_url?: string; logo_key?: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiUpload<components["schemas"]["PartnerLogoUploadResponse"]>(
      `/api/v1/admin/partners/${partnerId}/logo`,
      formData
    );
    if (!res.success) {
      throw new Error("Failed to upload logo");
    }
    const logoUrl = res.logo_url ?? res.data?.logo_url;
    const logoKey = res.data?.logo_key;
    if (!logoUrl && !logoKey) {
      throw new Error("Failed to upload logo");
    }
    return { logo_url: logoUrl, logo_key: logoKey };
  },

  recordStepView: async (stepId: string, transactionId: string): Promise<void> => {
    await apiPost("/api/v1/rev-share/step-views", {
      step_id: stepId,
      transaction_id: transactionId,
    });
  },
};
