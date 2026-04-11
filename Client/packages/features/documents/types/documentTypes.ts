// Document types schema with dictionary of document types

export type DocumentTypeId = "report" | "contract" | "inspection" | "financial";

export type ReportType = "detailed" | "standard";

export type DocumentTypeDefinition = {
  id: DocumentTypeId;
  name: string;
  description: string;
  required_for: string[]; // e.g., ['offer', 'closing', 'inspection']
  report_types: ReportType[]; // Which report types are valid for this document type
  template_url?: string;
};

/**
 * Dictionary of document types with their definitions
 */
export const DOCUMENT_TYPES: Record<DocumentTypeId, DocumentTypeDefinition> = {
  report: {
    id: "report",
    name: "Report",
    description: "Property analysis reports",
    required_for: ["offer", "closing"],
    report_types: ["detailed", "standard"],
  },
  contract: {
    id: "contract",
    name: "Contract",
    description: "Sales contracts and related documents",
    required_for: ["offer", "closing"],
    report_types: ["standard"],
  },
  inspection: {
    id: "inspection",
    name: "Inspection",
    description: "Property inspection reports",
    required_for: ["inspection", "closing"],
    report_types: ["detailed", "standard"],
  },
  financial: {
    id: "financial",
    name: "Financial",
    description: "Loan documents and financial statements",
    required_for: ["financing", "closing"],
    report_types: ["standard"],
  },
};

/**
 * Get document type definition by ID
 */
export function getDocumentType(id: DocumentTypeId): DocumentTypeDefinition {
  return DOCUMENT_TYPES[id];
}

/**
 * Get all document types as an array
 */
export function getAllDocumentTypes(): DocumentTypeDefinition[] {
  return Object.values(DOCUMENT_TYPES);
}

/**
 * Get valid report types for a document type
 */
export function getValidReportTypes(
  documentTypeId: DocumentTypeId,
): ReportType[] {
  return DOCUMENT_TYPES[documentTypeId]?.report_types ?? [];
}

/**
 * Check if a report type is valid for a document type
 */
export function isValidReportTypeForDocumentType(
  documentTypeId: DocumentTypeId,
  reportType: ReportType,
): boolean {
  return getValidReportTypes(documentTypeId).includes(reportType);
}
