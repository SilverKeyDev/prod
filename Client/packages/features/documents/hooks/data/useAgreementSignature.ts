import { useMemo } from "react";

/**
 * Temporary, provider-agnostic stub for agreement signature data.
 * This will be wired to the new signing provider endpoints once they
 * are implemented on the server.
 */

export type UseAgreementSignatureResult = {
  signatureStatus: "unconfigured";
  canSign: boolean;
  signingUrl: string | null;
  isSignatureConfigured: boolean;
};

export function useAgreementSignature(_agreementId?: string): UseAgreementSignatureResult {
  // While the signing provider is being migrated, always report that
  // signatures are not yet configured.
  return useMemo(
    () => ({
      signatureStatus: "unconfigured",
      canSign: false,
      signingUrl: null,
      isSignatureConfigured: false,
    }),
    []
  );
}
