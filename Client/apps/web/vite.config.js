import inject from "@rollup/plugin-inject";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, loadEnv } from "vite";

import { buildWebViteResolve } from "./vite.config.resolve.js";
import { seoStaticFilesPlugin } from "./vite.plugin.seo.js";
import { webManualChunks } from "./vite/build.manualChunks.js";
import { createProcessShimPlugins } from "./vite/plugin.processShim.js";
import { createWebStubNativePlugin } from "./vite/plugin.webStubNative.js";
import { REACT_NATIVE_STUB } from "./vite/reactNativeStub.js";

var root = path.resolve(__dirname, "../..");
var packages = path.join(root, "packages");
var uiComponents = path.join(packages, "ui/components");

export default defineConfig(function (_a) {
  var mode = _a.mode;
  // .env is NOT loaded into process.env before config runs; load it so define has correct values
  var env = loadEnv(mode, root, "");
  function str(v) {
    return (v !== null && v !== void 0 ? v : "").toString().trim();
  }
  function pickEnv(key) {
    return str(env[key] ?? process.env[key]);
  }
  /** Build-time only (vite.plugin.seo.js); not read by packages/config/env.ts. */
  var seoPublicSiteUrl = pickEnv("EXPO_PUBLIC_SITE_URL").replace(/\/$/, "");
  var seoGoogleSiteVerification = pickEnv("EXPO_PUBLIC_GOOGLE_SITE_VERIFICATION");
  var nodeEnv = mode === "production" ? "production" : "development";
  var webDevPort = parseInt(process.env.WEB_DEV_PORT || process.env.CLIENT_WEB_PORT || "5173", 10);
  var envVars = {
    NODE_ENV: nodeEnv,
    DEV: nodeEnv !== "production",
    PROD: nodeEnv === "production",
    EXPO_PUBLIC_GOOGLE_MAPS_ID: pickEnv("EXPO_PUBLIC_GOOGLE_MAPS_ID"),
    EXPO_PUBLIC_GOOGLE_CLIENT_ID: pickEnv("EXPO_PUBLIC_GOOGLE_CLIENT_ID"),
    EXPO_PUBLIC_PLAID_CLIENT_ID: pickEnv("EXPO_PUBLIC_PLAID_CLIENT_ID"),
    EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS: pickEnv("EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS"),
    EXPO_PUBLIC_USE_GOOGLE_MAPS_IOS_SIMULATOR: pickEnv("EXPO_PUBLIC_USE_GOOGLE_MAPS_IOS_SIMULATOR"),
    EXPO_PUBLIC_API_URL: pickEnv("EXPO_PUBLIC_API_URL"),
    EXPO_PUBLIC_API_BASE_URL: pickEnv("EXPO_PUBLIC_API_BASE_URL"),
    EXPO_PUBLIC_POSTHOG_KEY: pickEnv("EXPO_PUBLIC_POSTHOG_KEY"),
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
  var analyze = process.env.ANALYZE === "1" || process.env.ANALYZE === "true";
  return {
    root: __dirname,
    base: "/",
    envPrefix: "EXPO_PUBLIC_",
    plugins: [
      react(),
      seoStaticFilesPlugin({
        root: root,
        publicSiteUrl: seoPublicSiteUrl,
        googleSiteVerification: seoGoogleSiteVerification,
      }),
      createWebStubNativePlugin({ reactNativeStub: REACT_NATIVE_STUB }),
      ...createProcessShimPlugins({ envVars: envVars, shimPath: shimPath }),
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
      port: webDevPort,
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
        port: webDevPort,
        clientPort: webDevPort,
      },
      // Proxy: secure: false is intentional for local HTTP backend (e.g. Flask on localhost:5000).
      // If the backend requires SameSite=None; Secure cookies, serve dev over HTTPS (e.g. use
      // @vitejs/plugin-basic-ssl) and open https://localhost:<WEB_DEV_PORT>, or cookies will be
      // dropped on http://localhost.
      proxy: {
        "/r": {
          target: process.env.WEB_API_PROXY || "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
        "/api": {
          target: process.env.WEB_API_PROXY || "http://localhost:5000",
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
          target: process.env.WEB_API_PROXY || "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
        "/livez": {
          target: process.env.WEB_API_PROXY || "http://localhost:5000",
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
      chunkSizeWarningLimit: 1700,
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
          manualChunks: webManualChunks,
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
