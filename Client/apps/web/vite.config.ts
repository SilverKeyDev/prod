import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  root: __dirname,
  base: "/",
  plugins: [react()],
  publicDir: path.resolve(__dirname, "../../public"),
  css: {
    postcss: "./postcss.config.js",
  },
  server: {
    host: "0.0.0.0",
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
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
      },
      "/healthz": {
        target: "http://127.0.0.1:5000",
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
