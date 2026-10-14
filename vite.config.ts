import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { docsPlugin } from "./app/lib/docs/vite-plugin-docs";

export default defineConfig({
  plugins: [
    tsconfigPaths(), // First for path resolution
    docsPlugin(), // Process docs/**/*.md before routing
    tailwindcss(),
    reactRouter(),
  ],
  build: {
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        // shadcn/Base UI components ship `"use client"`; this app has no RSC,
        // so the directive and its unresolvable sourcemap warning are just noise.
        if (
          warning.code === "SOURCEMAP_ERROR" ||
          warning.code === "MODULE_LEVEL_DIRECTIVE"
        ) {
          return;
        }
        defaultHandler(warning);
      },
    },
  },
});
