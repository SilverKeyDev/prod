import { defineConfig, loadEnv, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
const root = path.resolve(__dirname, "../..");
const packages = path.join(root, "packages");
const uiComponents = path.join(packages, "ui/components");

/** Stub for react-native in web build: no bare specifier in output, safe no-op exports. */
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
export default defineConfig(({ mode }) => {
  // .env is NOT loaded into process.env before config runs; load it so define has correct values
  const env = loadEnv(mode, root, "");
  return {
    root: __dirname,
    base: "/",
    plugins: [
      react(),
      {
        name: "exclude-native-files",
        enforce: "pre",
        resolveId(id, importer) {
          // Stub React Native and .native.* so no bare specifiers appear in the web bundle
          const isReactNative =
            id === "react-native" ||
            id.startsWith("react-native/") ||
            id.startsWith("@react-native/") ||
            id.includes("/react-native/") ||
            id.includes("node_modules/react-native");
          const isNativeFile =
            id.includes(".native.") ||
            (importer && importer.includes(".native.")) ||
            (importer && importer.includes("react-native"));
          if (isReactNative) {
            return "\0web-stub:react-native";
          }
          if (isNativeFile) {
            return "\0web-stub:native";
          }
          return null;
        },
        load(id) {
          if (id === "\0web-stub:react-native") {
            return REACT_NATIVE_STUB;
          }
          if (id === "\0web-stub:native") {
            return "export {};";
          }
          if (id.includes("react-native") || id.includes(".native.")) {
            return "export {};";
          }
          return null;
        },
      },
    ] as PluginOption[],
    envDir: root, // Look for .env in Client directory
    // Inject process.env so packages/config/env.ts (process.env-only) sees values when built with Vite
    define: {
      "process.env.VITE_GOOGLE_MAPS_ID": JSON.stringify(
        env.VITE_GOOGLE_MAPS_ID ?? process.env.VITE_GOOGLE_MAPS_ID ?? ""
      ),
      "process.env.VITE_GOOGLE_CLIENT_ID": JSON.stringify(
        env.VITE_GOOGLE_CLIENT_ID ?? process.env.VITE_GOOGLE_CLIENT_ID ?? ""
      ),
      "process.env.VITE_PLAID_CLIENT_ID": JSON.stringify(
        env.VITE_PLAID_CLIENT_ID ?? process.env.VITE_PLAID_CLIENT_ID ?? ""
      ),
      "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development"),
    },
    publicDir: path.join(root, "public"),
    css: {
      postcss: "./postcss.config.js",
    },
    server: {
      host: "localhost", // Changed from 0.0.0.0 to localhost for cookie consistency
      port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT, 10) : 5173,
      strictPort: true,
      // Allow resolving/serving from Client root so node_modules (zustand, react, etc.) is accessible
      fs: {
        allow: [root],
      },
      watch: {
        usePolling: true,
        interval: 100,
      },
      hmr: {
        protocol: "ws",
        host: "localhost",
        port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT, 10) : 5173,
        clientPort: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT, 10) : 5173,
      },
      // Proxy: secure: false is intentional for local HTTP backend (e.g. Flask on localhost:5000).
      // If the backend requires SameSite=None; Secure cookies, serve dev over HTTPS (e.g. set
      // VITE_DEV_HTTPS=1 and use @vitejs/plugin-basic-ssl) and open https://localhost:5173, or
      // cookies will be dropped on http://localhost.
      proxy: {
        "/api": {
          target: process.env.VITE_API_PROXY || "http://localhost:5000",
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("proxyRes", (_proxyRes) => {
              // Ensure Set-Cookie headers pass through unmodified
              // Do NOT use cookieDomainRewrite as it can interfere with localhost cookies
            });
          },
        },
        "/healthz": {
          target: process.env.VITE_API_PROXY || "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
        // Ecosystem dev: mount Expo/Metro web app at /apps/mobile; Metro runs at :8081 root.
        "/apps/mobile": {
          target: "http://localhost:8081",
          changeOrigin: true,
          ws: true,
          rewrite: (p) => p.replace(/^\/apps\/mobile/, "") || "/",
        },
      },
    },
    optimizeDeps: {
      // Do not include @tanstack/react-query: resolve.alias points it at Client node_modules, so
      // pre-bundling would fail ("Cannot optimize dependency"). resolve.dedupe already enforces a single instance.
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "lucide-react",
        "hls.js",
        "embla-carousel-react",
        "react-virtuoso",
      ],
      exclude: [
        "@types/*",
        "zustand",
        "react-native",
        "@react-native/virtualized-lists",
        "@react-native-community/slider",
        "@react-native-masked-view/masked-view",
        "react-native-svg",
        "react-native-web",
        "react-native-gesture-handler",
        "react-native-keyboard-controller",
        "react-native-maps",
        "react-native-phone-number-input",
        "react-native-reanimated",
        "react-native-safe-area-context",
        "react-native-screens",
        "react-native-webview",
      ],
    },
    build: {
      target: "es2020",
      // Enable sourcemaps for production debugging (consistent with dev behavior)
      sourcemap: true,
      // Enable minification for production (standard practice)
      minify: "esbuild",
      outDir: path.join(root, "dist"),
      // Configure code splitting for consistent behavior
      rollupOptions: {
        output: {
          // Ensure consistent chunk naming and splitting
            manualChunks: (id) => {
            // Vendor chunks for better caching
            if (id.includes("node_modules")) {
              // Keep React and all React-dependent libs in one chunk so React is initialized
              // before they run (avoids prod-only "Cannot set properties of undefined (setting
              // 'Children')" and "Cannot read properties of undefined (reading 'createContext')"
              // when vendor runs before react-vendor).
              if (
                id.includes("react") ||
                id.includes("react-dom") ||
                id.includes("use-sync-external-store") ||
                id.includes("zustand") ||
                id.includes("framer-motion") ||
                id.includes("@tanstack")
              ) {
                return "react-vendor";
              }
              // Don't split react-router into separate chunk - keep it with main bundle
              // to prevent timing issues where router context isn't available when hooks run
              if (id.includes("react-router")) {
                return undefined; // Include in main bundle to ensure router context is always available
              }
              // Other vendor code
              return "vendor";
            }
            // Critical Router-dependent code should not be split
            if (
              id.includes("app/routes") &&
              (id.includes("routes.tsx") || id.includes("StoreIntegrations"))
            ) {
              return undefined; // Include in main bundle
            }
            // Ensure hooks that use router are in main bundle
            if (id.includes("packages/hooks") && id.includes("useDataPolling")) {
              return undefined; // Include in main bundle
            }
          },
          // Consistent chunk file naming
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
        },
      },
      // Ensure consistent module resolution
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
    },
    resolve: {
      // Prefer web when package exports specify conditions (no .native in web build)
      conditions: ["web", "import", "module", "browser", "default"],
      // Aliases: broad roots (components, ui, packages, features) first; overrides only where path doesn't match layout. Order matters (specific before regex).
      // Path aliases should stay in sync with tsconfig.base.json paths; Metro (mobile) reads the same via packages/config/resolve-paths.cjs.
      alias: [
        // Package redirects (logical path -> actual path; must be before packages/* regex)
        { find: "packages/types", replacement: path.join(packages, "types") },
        { find: "packages/types/", replacement: path.join(packages, "types/") },
        {
          find: "packages/hooks/data/auth",
          replacement: path.join(packages, "features/homeauth/hooks/data"),
        },
        {
          find: "packages/hooks/data/chat",
          replacement: path.join(packages, "features/messaging/hooks/data"),
        },
        {
          find: "packages/features/agent/src",
          replacement: path.join(packages, "features/agent/components"),
        },
        {
          find: "packages/features/dashboard/src",
          replacement: path.join(packages, "features/dashboard/components"),
        },
        {
          find: "packages/features/saved/src",
          replacement: path.join(packages, "features/saved/components"),
        },
        { find: "packages/styles", replacement: path.join(packages, "ui/styles") },
        { find: "packages/ui/components/ui", replacement: uiComponents },
        {
          find: "packages/config/api/documents/report",
          replacement: path.join(packages, "features/documents/api/report"),
        },
        {
          find: "packages/utils/domain/compare",
          replacement: path.join(packages, "features/compare/utils"),
        },
        {
          find: "packages/utils/domain/compare/csvUtils",
          replacement: path.join(packages, "features/compare/utils/csvUtils"),
        },
        {
          find: "packages/utils/domain/compare/types",
          replacement: path.join(packages, "features/compare/utils/types"),
        },
        {
          find: "packages/utils/profile",
          replacement: path.join(packages, "features/profile/utils"),
        },
        {
          find: "packages/utils/profile/",
          replacement: path.join(packages, "features/profile/utils/"),
        },
        // packages/* catch-all (after specific package redirects)
        { find: /^packages\/(.*)$/, replacement: `${packages}/$1` },
        // @/ overrides where import path doesn't match folder layout
        {
          find: "@/features/agent/modals",
          replacement: path.join(packages, "features/agent/components/modals"),
        },
        {
          find: "@/features/documents/data",
          replacement: path.join(packages, "features/documents/hooks/data"),
        },
        {
          find: "@/features/feed/Reels",
          replacement: path.join(packages, "features/feed/components/Reels"),
        },
        {
          find: "@/features/homeauth/types/user",
          replacement: path.join(packages, "features/homeauth/types"),
        },
        {
          find: "@/features/saved/SavedLayout",
          replacement: path.join(packages, "features/saved/components/SavedLayout"),
        },
        {
          find: "@/components/ui/button",
          replacement: path.join(uiComponents, "primitives/button"),
        },
        { find: "@/components/ui/form", replacement: path.join(uiComponents, "primitives/form") },
        {
          find: "@/components/ui/form/FormField",
          replacement: path.join(uiComponents, "form/FormField"),
        },
        {
          find: "@/components/modals/PropertyDetailsModal",
          replacement: path.join(
            packages,
            "features/propertyDetails/components/PropertyDetailsModal"
          ),
        },
        {
          find: "@/components/ui/asset/MiniLogo.web",
          replacement: path.join(uiComponents, "asset/MiniLogo"),
        },
        { find: "@/components/ui/media", replacement: path.join(uiComponents, "primitives/media") },
        { find: "@ui/media", replacement: path.join(uiComponents, "primitives/media") },
        { find: "@ui/loading", replacement: path.join(uiComponents, "asset/loading") },
        // Broad roots: components, features, ui, app root, logger, packages
        { find: "@/components/ui", replacement: uiComponents },
        { find: "@/components", replacement: uiComponents },
        { find: "@/features", replacement: path.join(packages, "features") },
        { find: /^@\/(.*)$/, replacement: path.join(__dirname, "$1") }, // app root @/ only; do not match @tanstack etc.
        { find: "@ui", replacement: uiComponents },
        { find: "logger", replacement: path.join(packages, "logger") },
        { find: "packages", replacement: packages },
      ],
      // Prefer .web.* when building web so platform-only modules resolve without extension in imports
      extensions: [
        ".web.tsx",
        ".web.ts",
        ".tsx",
        ".ts",
        ".web.jsx",
        ".web.js",
        ".jsx",
        ".js",
        ".json",
      ],
      // Ensure consistent module resolution
      dedupe: [
        "react",
        "react-dom",
        "react-router-dom",
        "zustand",
        "@tanstack/react-query",
        "@headlessui/react",
        "lucide-react",
        "framer-motion",
      ],
    },
  };
});
