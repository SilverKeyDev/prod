import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/primitives";

import { BodyText } from "@/components/ui";

export type DocuSignNoticeVariant =
  | "embedded_signing"
  | "sender_url_iframe"
  | "signed_document_complete";

const VARIANT_KEYS: Record<DocuSignNoticeVariant, string> = {
  embedded_signing: "docusign.notice_embedded_legal",
  sender_url_iframe: "docusign.notice_sender_url",
  signed_document_complete: "docusign.notice_signed_complete",
};

const VARIANT_DEFAULTS: Record<DocuSignNoticeVariant, string> = {
  embedded_signing:
    "Please review and sign the document below. Your signature will be legally binding.",
  sender_url_iframe:
    "Complete signing in the window below. Close this dialog when you are done.",
  signed_document_complete:
    "This document has been completed and signed. All signatures are legally binding.",
};

export type DocuSignLegalNoticeProps = {
  variant: DocuSignNoticeVariant;
  className?: string;
};

/**
 * Token-aligned notice banner for DocuSign embeds and related flows (web).
 */
export function DocuSignLegalNotice({
  variant,
  className = "mb-3",
}: DocuSignLegalNoticeProps) {
  const { t } = useLocalization();
  const key = VARIANT_KEYS[variant];

  return (
    <Box
      className={`border-border bg-accent-muted rounded-lg border p-3 ${className}`.trim()}
    >
      <BodyText size="sm" className="text-text-primary">
        {t(key, { defaultValue: VARIANT_DEFAULTS[variant] })}
      </BodyText>
    </Box>
  );
}
