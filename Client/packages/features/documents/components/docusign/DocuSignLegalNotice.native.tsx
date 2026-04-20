import { StyleSheet } from "react-native";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import { Box } from "packages/ui/components/primitives";

import { BodyText } from "@/components/ui";

import type { DocuSignNoticeVariant } from "./DocuSignLegalNotice";

const VARIANT_KEYS: Record<DocuSignNoticeVariant, string> = {
  embedded_signing: "docusign.notice_embedded_legal",
  sender_url_iframe: "docusign.notice_sender_url",
  signed_document_complete: "docusign.notice_signed_complete",
};

const VARIANT_DEFAULTS: Record<DocuSignNoticeVariant, string> = {
  embedded_signing:
    "Please review and sign the document below. Your signature will be legally binding.",
  sender_url_iframe: "Complete signing in the window below. Close this dialog when you are done.",
  signed_document_complete:
    "This document has been completed and signed. All signatures are legally binding.",
};

type DocuSignLegalNoticeNativeProps = {
  variant: DocuSignNoticeVariant;
};

/**
 * Token-aligned notice banner for DocuSign embeds (React Native).
 */
export function DocuSignLegalNotice({ variant }: DocuSignLegalNoticeNativeProps) {
  const { t } = useLocalization();
  const key = VARIANT_KEYS[variant];

  return (
    <Box style={styles.wrap}>
      <BodyText size="sm" style={styles.text}>
        {t(key, { defaultValue: VARIANT_DEFAULTS[variant] })}
      </BodyText>
    </Box>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color("border"),
    backgroundColor: color("accent-muted"),
    padding: 12,
  },
  text: {
    color: color("text-primary"),
  },
});
