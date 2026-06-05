/**
 * Embeds a JSON snapshot of shared homes/documents in chat `message` text so
 * recipients see price, sqft, image, etc. without relying on local saved-homes
 * or documents lists. Prefix keeps backward compatibility with empty messages.
 *
 * Multi-attachment shares use `kind: "bundle"` with a discriminated `items`
 * array (homes, documents, checklist forms). Legacy payloads used `homes` only.
 */

export * from "./sharedAttachmentSnapshot.build";
export * from "./sharedAttachmentSnapshot.merge";
export * from "./sharedAttachmentSnapshot.parse";
export * from "./sharedAttachmentSnapshot.types";
