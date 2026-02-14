import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  root: __dirname,
  base: "/",
  plugins: [react()],
  envDir: path.resolve(__dirname, "../.."), // Look for .env in Client directory
  publicDir: path.resolve(__dirname, "../../public"),
  css: {
    postcss: "./postcss.config.js",
  },
  server: {
    host: "localhost", // Changed from 0.0.0.0 to localhost for cookie consistency
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT, 10) : 5173,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT, 10) : 5173,
      clientPort: process.env.VITE_PORT
        ? parseInt(process.env.VITE_PORT, 10)
        : 5173,
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY || "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
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
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "zustand",
    ],
    exclude: ["@types/*"],
  },
  build: {
    target: "es2020",
    // Enable sourcemaps for production debugging (consistent with dev behavior)
    sourcemap: true,
    // Enable minification for production (standard practice)
    minify: "esbuild",
    outDir: path.resolve(__dirname, "../../dist"),
    // Configure code splitting for consistent behavior
    rollupOptions: {
      output: {
        // Ensure consistent chunk naming and splitting
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            // Don't split react-router into separate chunk - keep it with main bundle
            // to prevent timing issues where router context isn't available when hooks run
            if (id.includes("react-router")) {
              return undefined; // Include in main bundle to ensure router context is always available
            }
            if (id.includes("@tanstack")) {
              return "query-vendor";
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
    alias: {
      "@": path.resolve(__dirname, "."),
      packages: path.resolve(__dirname, "../../packages"),
    },
    // Ensure consistent module resolution
    dedupe: ["react", "react-dom", "react-router-dom"],
  },
});
