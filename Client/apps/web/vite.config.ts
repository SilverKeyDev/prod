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
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173,
      clientPort: 5173,
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
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
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
    exclude: ["@types/*"],
  },
  build: {
    target: "es2020",
    sourcemap: false,
    minify: false,
    outDir: path.resolve(__dirname, "../../dist"),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      packages: path.resolve(__dirname, "../../packages"),
    },
  },
});
