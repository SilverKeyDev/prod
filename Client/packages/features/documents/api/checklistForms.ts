/**
 * API client for checklist forms (agent-only endpoints).
 */

import type {
  ChecklistForm,
  DownloadFormResponse,
  GetFormsResponse,
  SendFormRequest,
  SendFormResponse,
} from "packages/features/documents/types/forms";
import { log, LOG_CATEGORIES } from "packages/logger";
import { apiGet, apiPost } from "packages/services/http/compatibility";

/**
 * Checklist forms API client.
 * List/download/send are agent-only; clients receive forms via chat attachments.
 */
export const checklistFormsApi = {
  /**
   * Get available forms for a checklist step.
   *
   * Returns forms defined in the step's suggested_form_ids field with download URLs.
   *
   * @param transactionId - Transaction ID
   * @param section - Checklist section (e.g. "escrow", "financing")
   * @param itemId - Step ID within the section
   *
   * @returns Promise resolving to array of forms with presigned download URLs
   *
   * @throws {Error} If user is not an agent or request fails
   */
  getFormsForStep: (
    transactionId: string,
    section: string,
    itemId: number
  ): Promise<GetFormsResponse> => {
    log.debug(LOG_CATEGORIES.API, "Fetching forms for checklist step", {
      transactionId,
      section,
      itemId,
    });
    return apiGet<GetFormsResponse>(
      `/api/v1/transactions/${transactionId}/checklist-items/${section}/${itemId}/forms`
    );
  },

  /**
   * Generate a presigned download URL for a form.
   *
   * @param transactionId - Transaction ID
   * @param section - Checklist section
   * @param itemId - Step ID
   * @param formId - Form ID to download
   *
   * @returns Promise resolving to presigned download URL
   *
   * @throws {Error} If form not found or user is not an agent
   */
  downloadForm: (
    transactionId: string,
    section: string,
    itemId: number,
    formId: string
  ): Promise<DownloadFormResponse> => {
    log.debug(LOG_CATEGORIES.API, "Generating form download URL", {
      transactionId,
      section,
      itemId,
      formId,
    });
    return apiGet<DownloadFormResponse>(
      `/api/v1/transactions/${transactionId}/checklist-items/${section}/${itemId}/forms/${formId}/download`
    );
  },

  /**
   * Send form to client via DocuSign and/or messaging.
   *
   * `method: "messaging"` sends a chat message with a checklist form attachment.
   *
   * @param transactionId - Transaction ID
   * @param section - Checklist section
   * @param itemId - Step ID
   * @param formId - Form ID to send
   * @param data - Send parameters (method, conversation_id, participants, message)
   *
   * @returns Promise resolving to send result
   *
   * @throws {Error} If form not found or user is not an agent
   */
  sendForm: (
    transactionId: string,
    section: string,
    itemId: number,
    formId: string,
    data: SendFormRequest
  ): Promise<SendFormResponse> => {
    log.info(LOG_CATEGORIES.API, "Sending form to client", {
      transactionId,
      section,
      itemId,
      formId,
      method: data.method,
    });
    return apiPost<SendFormResponse>(
      `/api/v1/transactions/${transactionId}/checklist-items/${section}/${itemId}/forms/${formId}/send`,
      data
    );
  },

  /**
   * List all forms grouped by category (forms library).
   *
   * Returns all available forms organized by category/folder.
   * Agent-only endpoint.
   *
   * @returns Promise resolving to categories with forms
   *
   * @throws {Error} If user is not an agent
   *
   * @example
   * ```typescript
   * const { categories } = await checklistFormsApi.listFormsLibrary();
   * categories.forEach(cat => {
   *   console.log(`${cat.name}: ${cat.forms.length} forms`);
   * });
   * ```
   */
  listFormsLibrary: (): Promise<{
    success: boolean;
    categories: Array<{ name: string; forms: ChecklistForm[] }>;
  }> => {
    log.debug(LOG_CATEGORIES.API, "Fetching forms library");
    return apiGet("/api/v1/forms/library");
  },

  /**
   * Get download URL for a form from the library.
   *
   * @param formId - Form ID
   *
   * @returns Promise resolving to download URL and form metadata
   *
   * @throws {Error} If form not found or user is not an agent
   */
  getLibraryFormDownloadUrl: (
    formId: string
  ): Promise<{
    success: boolean;
    download_url: string;
    form: ChecklistForm;
  }> => {
    log.debug(LOG_CATEGORIES.API, "Getting library form download URL", {
      formId,
    });
    return apiGet(`/api/v1/forms/library/${formId}/download`);
  },
};

// Re-export types for convenience
export type { ChecklistForm, SendFormRequest };
