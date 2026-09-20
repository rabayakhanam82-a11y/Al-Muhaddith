import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  server: {
    host: "0.0.0.0",
    hmr: false,
    port: Number(process.env.PORT) || 3000,
  },
  preview: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 3000,
  },
  build: {
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
