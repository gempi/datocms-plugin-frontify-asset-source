import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import stylex from "@stylexjs/unplugin";

export default defineConfig({
  base: "./",
  plugins: [
    stylex.vite({
      useCSSLayers: true,
    }),
    react(),
  ],
});
