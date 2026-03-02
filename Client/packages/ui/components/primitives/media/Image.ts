/**
 * Barrel so that "primitives/media/Image" and "./Image" resolve for TypeScript/ESLint.
 * Web build uses this; Metro resolves to Image.native.tsx for RN.
 */
export { default } from "./Image.web";
