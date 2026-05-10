import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // <-- ДОБАВЛЕНО
import path from "path";

export default defineConfig({
  plugins: [
    tailwindcss(), // <-- ДОБАВЛЕНО
    react()
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