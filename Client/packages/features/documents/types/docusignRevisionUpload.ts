import { createBlob } from "packages/utils/platform";

/** Binary body for DocuSign revision upload; create via `createBlob()` from `packages/utils/platform`. */
export type DocusignRevisionUploadBody = ReturnType<typeof createBlob>;
