import path from "path";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

import { buildWebViteResolve } from "./apps/web/vite.config.resolve.js";

const root = path.resolve(__dirname);
const packages = path.join(root, "packages");
const uiComponents = path.join(packages, "ui/components");
const webAppDir = path.join(root, "apps/web");

const webResolve = buildWebViteResolve(packages, uiComponents, webAppDir);

/** Aligns with apps/web/vite.config.js: bare react-native must not be parsed in jsdom unit tests. */
const REACT_NATIVE_STUB = `
export default {};
export const Platform = { OS: "web", select: (o) => (o && (o.web ?? o.default)) };
const noop = () => null;
export const View = noop;
export const Text = noop;
export const Image = noop;
export const ScrollView = noop;
export const TouchableOpacity = noop;
export const Pressable = noop;
export const Modal = noop;
export const StyleSheet = { create: (s) => s, flatten: (x) => x };
export const Animated = { View: noop, Value: class {}, timing: () => ({ start: () => {} }) };
export const Easing = {};
export const Dimensions = { get: () => ({ width: 0, height: 0 }) };
export const ActivityIndicator = noop;
export const FlatList = noop;
export const TextInput = noop;
export const KeyboardAvoidingView = noop;
export const SafeAreaView = noop;
export const Linking = { openURL: () => Promise.resolve() };
export const Alert = { alert: () => {} };
export const NativeModules = {};
class NativeEventEmitter {
  addListener() { return { remove: () => {} }; }
  removeAllListeners() {}
}
export { NativeEventEmitter };
`;

function vitestReactNativeStubPlugin(): Plugin {
  return {
    name: "vitest-react-native-stub",
    enforce: "pre",
    resolveId(id) {
      if (
        id === "react-native" ||
        id.startsWith("react-native/") ||
        id.startsWith("@react-native/")
      ) {
        return "\0vitest-stub:react-native";
      }
      return null;
    },
    load(id) {
      if (id === "\0vitest-stub:react-native") {
        return REACT_NATIVE_STUB;
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [vitestReactNativeStubPlugin()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [],
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/apps/web/e2e/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary", "lcov"],
      reportsDirectory: "./coverage",

      // Coverage thresholds by directory
      thresholds: {
        // High-value shared code: 70% coverage required
        "packages/utils/": {
          lines: 70,
          functions: 70,
          branches: 65,
          statements: 70,
        },
        "packages/hooks/": {
          lines: 70,
          functions: 70,
          branches: 65,
          statements: 70,
        },

        // Feature code: 50% coverage required
        "packages/features/": {
          lines: 50,
          functions: 50,
          branches: 45,
          statements: 50,
        },

        // Services and config: 60% coverage
        "packages/services/": {
          lines: 60,
          functions: 60,
          branches: 55,
          statements: 60,
        },
        "packages/config/": {
          lines: 60,
          functions: 60,
          branches: 55,
          statements: 60,
        },

        // Store slices: 50% coverage
        "packages/store/": {
          lines: 50,
          functions: 50,
          branches: 45,
          statements: 50,
        },
      },

      // Files to include in coverage
      include: ["packages/**/*.{ts,tsx}", "apps/web/**/*.{ts,tsx}"],

      // Files to exclude from coverage
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/__tests__/**",
        "**/node_modules/**",
        "**/dist/**",
        "**/*.config.{ts,js}",
        "**/*.d.ts",
        "**/types/**",
        "**/index.ts", // Barrel files
        "**/.native.{ts,tsx}", // React Native files (not tested in jsdom)
        "**/apps/mobile/**", // Mobile app (tested separately)
        "**/packages/logger/**", // Logger utilities
        "**/packages/contexts/**", // Context providers (integration tests)
      ],

      // Fail build if thresholds not met
      thresholdAutoUpdate: false,
      skipFull: false,
      all: true,
    },
  },

  resolve: webResolve,
});
