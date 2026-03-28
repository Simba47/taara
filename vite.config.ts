import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// v2.1 - admin store only initializes on admin routes
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    // Larger inline limit = fewer HTTP requests
    assetsInlineLimit: 4096,
    // Enable source maps in dev, disabled in prod for security
    sourcemap: mode === "development",
    rollupOptions: {
      output: {
        // Split vendor libs into separate cacheable chunks
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tabs"],
          "query-vendor": ["@tanstack/react-query"],
          "chart-vendor": ["recharts"],
          "supabase-vendor": ["@supabase/supabase-js"],
        },
      },
    },
  },
}));
