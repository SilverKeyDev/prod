/**
 * When Expo is started from the Client monorepo root (e.g. `npx expo start --web` from Client/),
 * Metro uses this config. It delegates to the mobile app config so that:
 * - projectRoot is apps/mobile (from the required module's __dirname)
 * - ../../App from expo/AppEntry.js resolves to apps/mobile/App.tsx
 * - packages/* and other monorepo resolution work as in apps/mobile.
 *
 * Preferred: run from the app directory so Expo uses apps/mobile as root:
 *   pnpm dev:mobile
 *   or: cd apps/mobile && npx expo start --web
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
export default require("./apps/mobile/metro.config.cjs");
