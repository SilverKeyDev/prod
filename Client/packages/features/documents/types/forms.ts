/**
 * Checklist forms types.
 * Forms are pre-defined documents (stored in S3 /forms/) that agents can download or send to clients.
 */

export type ChecklistForm = {
  id: string;
  form_key: string; // e.g. "earnest_money", "wire_instructions"
  title: string;
  description?: string;
  download_url: string; // Presigned S3 URL
  deadline?: string; // ISO date string
  category?: string; // e.g. "escrow", "financing"
  s3_template_path: string;
  created_at?: string;
  updated_at?: string;
};

export type SendFormRequest = {
  method: "docusign" | "messaging" | "both";
  conversation_id?: string; // Required if method includes "messaging"
  participants?: Array<{
    email: string;
    name: string;
  }>; // Optional for DocuSign
  message?: string; // Optional message text
};

export type GetFormsResponse = {
  success: boolean;
  forms: ChecklistForm[];
};

export type DownloadFormResponse = {
  success: boolean;
  download_url: string;
};

export type SendFormResponse = {
  success: boolean;
  error?: string;
  message?: string;
};
