/**
 * TypeScript default re-export for module resolution without platform suffixes.
 * Vite prefers `PropertyLocationMapSection.web.tsx`; Metro prefers `.native.tsx`.
 */
export { PropertyLocationMapSection } from "./PropertyLocationMapSection.native";
