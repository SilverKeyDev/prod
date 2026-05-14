/**
 * Tooling entry: ESLint/TS resolve `PdfModalBridge` without a bare `.web`/`.native` suffix.
 * Bundlers still prefer `PdfModalBridge.native.tsx` / `PdfModalBridge.web.tsx` when configured.
 */
export { default } from "./PdfModalBridge.web";
export { PdfModal } from "./PdfModalBridge.web";
