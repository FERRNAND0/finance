import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa"; // <-- ДОБАВЛЕН ИМПОРТ PWA
import path from "path";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    // <-- ДОБАВЛЕН ПЛАГИН PWA -->
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "S&F Finance Dashboard",
        short_name: "S&F",
        description: "Система управления финансами",
        theme_color: "#0b000b",
        background_color: "#0b000b",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    watch: {
      ignored: ["**/sf_backend/**", "**/venv/**"],
    },
  },
  optimizeDeps: {
    exclude: ["sf_backend"],
  },
});
