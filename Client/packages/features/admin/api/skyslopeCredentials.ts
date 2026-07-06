import { apiDelete, apiGet, apiPost, apiPut } from "packages/services/http";
import { HttpError } from "packages/services/http/client";
import type { components } from "packages/types/api.generated";
import { resolveApiResultErrorMessage } from "packages/utils/core/errorHandling";

export type BrokerageSkySlopeCredential = components["schemas"]["BrokerageSkySlopeCredential"];
export type BrokerageSkySlopeCredentialCreateRequest =
  components["schemas"]["BrokerageSkySlopeCredentialCreateRequest"];
export type BrokerageSkySlopeCredentialUpdateRequest =
  components["schemas"]["BrokerageSkySlopeCredentialUpdateRequest"];
export type BrokerageSkySlopeCredentialTestResponse =
  components["schemas"]["BrokerageSkySlopeCredentialTestResponse"];

type CredentialResponse = components["schemas"]["BrokerageSkySlopeCredentialResponse"];

function credentialPath(brokerageId: string): string {
  return `/api/v1/admin/brokerages/${encodeURIComponent(brokerageId.trim())}/integrations/skyslope`;
}

export const skyslopeCredentialsApi = {
  /** Returns null when credentials are not configured (404). */
  getCredential: async (brokerageId: string): Promise<BrokerageSkySlopeCredential | null> => {
    try {
      const response = await apiGet<CredentialResponse>(credentialPath(brokerageId));
      if (!response.success || !response.data) {
        throw new Error(
          resolveApiResultErrorMessage(response, "Failed to load SkySlope credentials")
        );
      }
      return response.data;
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) {
        return null;
      }
      throw err;
    }
  },

  createCredential: async (
    brokerageId: string,
    body: BrokerageSkySlopeCredentialCreateRequest
  ): Promise<BrokerageSkySlopeCredential> => {
    const response = await apiPost<CredentialResponse, BrokerageSkySlopeCredentialCreateRequest>(
      credentialPath(brokerageId),
      body
    );
    if (!response.success || !response.data) {
      throw new Error(
        resolveApiResultErrorMessage(response, "Failed to save SkySlope credentials")
      );
    }
    return response.data;
  },

  updateCredential: async (
    brokerageId: string,
    body: BrokerageSkySlopeCredentialUpdateRequest
  ): Promise<BrokerageSkySlopeCredential> => {
    const response = await apiPut<CredentialResponse, BrokerageSkySlopeCredentialUpdateRequest>(
      credentialPath(brokerageId),
      body
    );
    if (!response.success || !response.data) {
      throw new Error(
        resolveApiResultErrorMessage(response, "Failed to update SkySlope credentials")
      );
    }
    return response.data;
  },

  deleteCredential: async (brokerageId: string): Promise<void> => {
    const response = await apiDelete<{ success: boolean; message?: string }>(
      credentialPath(brokerageId)
    );
    if (!response.success) {
      throw new Error(
        resolveApiResultErrorMessage(response, "Failed to remove SkySlope credentials")
      );
    }
  },

  testConnection: async (brokerageId: string): Promise<BrokerageSkySlopeCredentialTestResponse> => {
    const response = await apiPost<BrokerageSkySlopeCredentialTestResponse>(
      `${credentialPath(brokerageId)}/test-connection`,
      {}
    );
    if (typeof response.success !== "boolean") {
      throw new Error(resolveApiResultErrorMessage(response, "SkySlope connection test failed"));
    }
    return response;
  },
};
