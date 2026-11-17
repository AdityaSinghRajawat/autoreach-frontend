import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 5173,
    // In development the API is proxied, so the browser talks to one origin.
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET ?? "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: true,
    // Fonts stay files, never data: URIs, so the CSP can keep font-src to 'self'.
    assetsInlineLimit: (filePath) => (filePath.endsWith(".woff2") ? false : undefined),
    rollupOptions: {
      output: {
        // Long-lived vendor chunks stay cached across app releases.
        codeSplitting: {
          groups: [
            { name: "react", test: /node_modules\/(react|react-dom|react-router|scheduler)\// },
            { name: "query", test: /node_modules\/@tanstack\// },
            { name: "charts", test: /node_modules\/(recharts|d3-[a-z-]+|victory-vendor)\// },
            {
              name: "motion",
              test: /node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
});
