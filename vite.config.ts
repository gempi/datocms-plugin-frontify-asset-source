import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import stylex from "@stylexjs/unplugin";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    stylex.vite({
      useCSSLayers: true,
      // ... other StyleX configuration options
    }),
    react(),
  ],
});
