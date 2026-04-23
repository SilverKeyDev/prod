import inject from "@rollup/plugin-inject";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, loadEnv } from "vite";

import { buildWebViteResolve } from "./vite.config.resolve.js";
import { seoStaticFilesPlugin } from "./vite.plugin.seo.js";
var root = path.resolve(__dirname, "../..");
var packages = path.join(root, "packages");
var uiComponents = path.join(packages, "ui/components");
/** Stub for react-native in web build: no bare specifier in output, safe no-op exports. */
var REACT_NATIVE_STUB =
  '\nexport default {};\nexport const Platform = { OS: "web", select: (o) => (o && (o.web ?? o.default)) };\nconst noop = () => null;\nexport const View = noop;\nexport const Text = noop;\nexport const Image = noop;\nexport const ScrollView = noop;\nexport const TouchableOpacity = noop;\nexport const Pressable = noop;\nexport const Modal = noop;\nexport const StyleSheet = { create: (s) => s, flatten: (x) => x };\nexport const Animated = { View: noop, Value: class {}, timing: () => ({ start: () => {} }) };\nexport const Easing = {};\nexport const Dimensions = { get: () => ({ width: 0, height: 0 }) };\nexport const ActivityIndicator = noop;\nexport const FlatList = noop;\nexport const TextInput = noop;\nexport const KeyboardAvoidingView = noop;\nexport const SafeAreaView = noop;\nexport const Linking = { openURL: () => Promise.resolve() };\nexport const Alert = { alert: () => {} };\nexport const NativeModules = {};\nclass NativeEventEmitter {\n  addListener() { return { remove: () => {} }; }\n  removeAllListeners() {}\n}\nexport { NativeEventEmitter };\n';
export default defineConfig(function (_a) {
  var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
  var mode = _a.mode;
  // .env is NOT loaded into process.env before config runs; load it so define has correct values
  var env = loadEnv(mode, root, "");
  var publicSiteUrl = (env.VITE_PUBLIC_SITE_URL ?? process.env.VITE_PUBLIC_SITE_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  var googleSiteVerification = (
    env.VITE_GOOGLE_SITE_VERIFICATION ??
    process.env.VITE_GOOGLE_SITE_VERIFICATION ??
    ""
  ).trim();
  var nodeEnv = mode === "production" ? "production" : "development";
  var envVars = {
    NODE_ENV: nodeEnv,
    VITE_GOOGLE_MAPS_ID:
      (_c =
        (_b = env.VITE_GOOGLE_MAPS_ID) !== null && _b !== void 0
          ? _b
          : process.env.VITE_GOOGLE_MAPS_ID) !== null && _c !== void 0
        ? _c
        : "",
    VITE_GOOGLE_CLIENT_ID:
      (_e =
        (_d = env.VITE_GOOGLE_CLIENT_ID) !== null && _d !== void 0
          ? _d
          : process.env.VITE_GOOGLE_CLIENT_ID) !== null && _e !== void 0
        ? _e
        : "",
    VITE_PLAID_CLIENT_ID:
      (_g =
        (_f = env.VITE_PLAID_CLIENT_ID) !== null && _f !== void 0
          ? _f
          : process.env.VITE_PLAID_CLIENT_ID) !== null && _g !== void 0
        ? _g
        : "",
    EXPO_PUBLIC_GOOGLE_MAPS_ID:
      (_h = env.EXPO_PUBLIC_GOOGLE_MAPS_ID) !== null && _h !== void 0 ? _h : "",
    EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS:
      (_j = env.EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS) !== null && _j !== void 0 ? _j : "",
    EXPO_PUBLIC_USE_GOOGLE_MAPS_IOS_SIMULATOR:
      (_k = env.EXPO_PUBLIC_USE_GOOGLE_MAPS_IOS_SIMULATOR) !== null && _k !== void 0 ? _k : "",
    EXPO_PUBLIC_API_URL: (_l = env.EXPO_PUBLIC_API_URL) !== null && _l !== void 0 ? _l : "",
    VITE_API_URL: (_m = env.VITE_API_URL) !== null && _m !== void 0 ? _m : "",
    EXPO_PUBLIC_API_BASE_URL:
      (_o = env.EXPO_PUBLIC_API_BASE_URL) !== null && _o !== void 0 ? _o : "",
    VITE_API_BASE_URL: (_p = env.VITE_API_BASE_URL) !== null && _p !== void 0 ? _p : "",
  };
  // esbuild define only accepts JSON literals or identifiers; object expressions like
  // ({ env: {...} }) are rejected. Inject process via a generated shim so env.ts sees process.env.
  var shimDir = path.join(root, "node_modules", ".vite");
  var shimPath = path.join(shimDir, "process-shim.cjs");
  fs.mkdirSync(shimDir, { recursive: true });
  var shimContent = "const env = ".concat(
    JSON.stringify(envVars),
    ";\nconst processLike = { env };\nmodule.exports = processLike;\nmodule.exports.default = processLike;"
  );
  fs.writeFileSync(shimPath, shimContent, "utf8");
  // #region agent log
  var debugLogPath = path.join(root, ".cursor", "debug-a0035d.log");
  try {
    var logLine =
      JSON.stringify({
        sessionId: "a0035d",
        id: "vite-shim-write",
        timestamp: Date.now(),
        location: "vite.config.ts:shim-write",
        message: "process-shim written",
        data: {
          shimPath: shimPath,
          contentSnippet: shimContent.slice(0, 200),
          hasDefaultInContent: shimContent.includes("default"),
        },
        runId: "build",
        hypothesisId: "A",
      }) + "\n";
    fs.appendFileSync(debugLogPath, logLine, "utf8");
  } catch {
    // Ignore debug log write failures (e.g. read-only FS).
  }
  // #endregion
  var analyze = process.env.ANALYZE === "1" || process.env.ANALYZE === "true";
  return {
    root: __dirname,
    base: "/",
    plugins: [
      react(),
      seoStaticFilesPlugin({
        root: root,
        publicSiteUrl: publicSiteUrl,
        googleSiteVerification: googleSiteVerification,
      }),
      {
        name: "exclude-native-files",
        enforce: "pre",
        resolveId: function (id, importer) {
          // Stub React Native and .native.* so no bare specifiers appear in the web bundle
          var isReactNative =
            id === "react-native" ||
            id.startsWith("react-native/") ||
            id.startsWith("@react-native/") ||
            id.includes("/react-native/") ||
            id.includes("node_modules/react-native");
          var isNativeFile =
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
        load: function (id) {
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
      {
        name: "process-shim-esm",
        enforce: "pre",
        resolveId: function (id) {
          var normalizedForLog = id.replace(/\?.*$/, "").replace(/^file:\/\//, "");
          var mightBeShim =
            id.includes("process-shim") ||
            id === shimPath ||
            normalizedForLog.endsWith("process-shim.cjs");
          var normalized = id.replace(/\?.*$/, "").replace(/^file:\/\//, "");
          var isShim =
            normalized === shimPath ||
            id.includes("process-shim") ||
            normalized.endsWith("process-shim.cjs");
          if (mightBeShim) {
            var debugLogPath_1 = path.join(root, ".cursor", "debug-a0035d.log");
            try {
              fs.appendFileSync(
                debugLogPath_1,
                JSON.stringify({
                  sessionId: "a0035d",
                  id: "resolveId-seen",
                  timestamp: Date.now(),
                  location: "vite.config.ts:resolveId",
                  message: "resolveId called for process-shim",
                  data: {
                    requestedId: id,
                    shimPath: shimPath,
                    normalized: normalized,
                    isShim: isShim,
                  },
                  runId: "debug-resolve",
                  hypothesisId: "D",
                }) + "\n",
                "utf8"
              );
            } catch {
              // Ignore debug log write failures (e.g. read-only FS).
            }
          }
          if (isShim) {
            return "\0process-shim-esm";
          }
          return null;
        },
        load: function (id) {
          if (id === "\0process-shim-esm") {
            // #region agent log
            try {
              fs.appendFileSync(
                path.join(root, ".cursor", "debug-a0035d.log"),
                JSON.stringify({
                  sessionId: "a0035d",
                  id: "process-shim-esm-load",
                  timestamp: Date.now(),
                  location: "vite.config.ts:load(process-shim-esm)",
                  message: "serving virtual process-shim as ESM",
                  data: {},
                  runId: "verify",
                  hypothesisId: "B",
                }) + "\n",
                "utf8"
              );
            } catch {
              // Ignore debug log write failures (e.g. read-only FS).
            }
            // #endregion
            // Fix: serve as ESM so default export exists; CJS->ESM interop does not expose default.
            return "export default { env: ".concat(JSON.stringify(envVars), " };");
          }
          return null;
        },
      },
      ...(analyze
        ? [
            visualizer({
              filename: path.join(root, "dist", "bundle-stats.html"),
              open: false,
              gzipSize: true,
              brotliSize: true,
              template: "treemap",
            }),
          ]
        : []),
      inject({
        process: [shimPath, "default"],
        exclude: ["**/node_modules/**"],
      }),
      {
        name: "process-shim-middleware",
        configureServer: function (server) {
          server.middlewares.use(function (req, res, next) {
            if (req.url && req.url.includes("process-shim.cjs")) {
              var esm = "export default { env: ".concat(JSON.stringify(envVars), " };");
              res.setHeader("Content-Type", "application/javascript");
              res.setHeader("Cache-Control", "no-cache");
              res.end(esm);
              return;
            }
            next();
          });
        },
      },
    ],
    envDir: root, // Look for .env in Client directory
    // esbuild define only accepts JSON literals or identifiers, never object expressions.
    // process is provided via inject (process-shim.cjs) above; do not add process here.
    define: {
      __DEV__: mode === "production" ? "false" : "true",
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
          configure: function (proxy) {
            proxy.on("proxyRes", function (_proxyRes) {
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
          rewrite: function (p) {
            return p.replace(/^\/apps\/mobile/, "") || "/";
          },
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
      // Production: avoid shipping public .map to clients (Lighthouse, bandwidth). Use ANALYZE=1 to debug.
      sourcemap: mode === "production" ? false : true,
      // Enable minification for production (standard practice)
      minify: "esbuild",
      outDir: path.join(root, "dist"),
      // dist lives under Client/ while Vite root is apps/web; clear it on production builds
      emptyOutDir: true,
      // Single vendor chunk is ~1.3MB minified; threshold avoids noisy Rollup reporter only
      chunkSizeWarningLimit: 1600,
      // Configure code splitting for consistent behavior (Vite 8+: rolldownOptions)
      rolldownOptions: {
        // Third-party deps (e.g. expo-modules-core uuid shim) use direct eval; @rollup/plugin-inject
        // is intentional until Rolldown inject is wired for dev + build together.
        checks: {
          eval: false,
          preferBuiltinFeature: false,
        },
        output: {
          // Ensure consistent chunk naming and splitting
          manualChunks: function (id) {
            // Vendor chunks for better caching
            if (id.includes("node_modules")) {
              // Single vendor chunk avoids Rollup "Circular chunk" between react-vendor and vendor.
              // Don't split react-router into separate chunk - keep it with main bundle
              // to prevent timing issues where router context isn't available when hooks run
              if (id.includes("react-router")) {
                return undefined; // Include in main bundle to ensure router context is always available
              }
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
    resolve: buildWebViteResolve(packages, uiComponents, __dirname),
  };
});
