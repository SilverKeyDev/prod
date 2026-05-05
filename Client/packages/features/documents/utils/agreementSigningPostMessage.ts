/**
 * Payload `source` for postMessage from `/agreements/:id/complete` when loaded inside
 * the DocuSign embedded signing iframe — lets the parent window treat completion as trusted (same origin).
 */
export const AGREEMENT_SIGNING_COMPLETE_POSTMESSAGE_SOURCE = "silverkey_agreement_complete_page";
