import { createBlob } from "packages/utils/core/platform";

/** Binary body for DocuSign revision upload; create via `createBlob()` from `packages/utils/core/platform`. */
export type DocusignRevisionUploadBody = ReturnType<typeof createBlob>;
