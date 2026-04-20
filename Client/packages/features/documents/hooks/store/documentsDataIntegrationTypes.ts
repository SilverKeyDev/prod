import type { DocumentData } from "packages/features/documents/hooks/data/useDocumentsData";

export type DocumentsDataIntegrationHandlers = {
  handleViewDocument: (documentId: string, documentName: string) => void;
  handleDownloadDocument: (documentId: string, documentName: string) => Promise<void>;
  handleShareDocument: (
    documentId: string,
    documentName: string
  ) => Promise<{ success: boolean; message: string }>;
};

export type SendForSignatureParams = {
  document: DocumentData;
  title: string;
  signingMethod?: "embedded" | "email";
  agreementType?: string;
  buyerId?: string;
  recipientUserId?: string;
};
