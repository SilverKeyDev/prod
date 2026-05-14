export type PdfModalProps = {
  currentPdf: string | null;
  currentReportAddress: string | null;
  reportId?: string | null;
  onClose: () => void;
  onShare?: () => void;
};
