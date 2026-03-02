/**
 * Re-export for TypeScript/platform resolution; bundler resolves to
 * `.web` or `.native` implementations at runtime.
 */
/* eslint-disable-next-line react-refresh/only-export-components -- Platform barrel: re-exports default + type for resolution */
export { type AppImageProps, default } from "./AppImage.web";
