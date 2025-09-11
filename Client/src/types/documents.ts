// Document-related type definitions

export interface Document {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: string;
  property_id?: string;
  offer_id?: string;
  uploaded_by: string;
  uploaded_at: Date;
  is_signed?: boolean;
  expiry_date?: Date;
  status: "pending" | "approved" | "rejected" | "expired";
}

export interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  required_for: string[]; // e.g., ['offer', 'closing', 'inspection']
  template_url?: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "completed" | "failed";
  error?: string;
}
