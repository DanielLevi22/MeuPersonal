import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/**/index.ts", "src/app/**/page.tsx", "src/app/**/layout.tsx"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@meupersonal/core": resolve(__dirname, "./src/packages/core"),
      "@meupersonal/supabase": resolve(__dirname, "./src/packages/supabase"),
      "@meupersonal/shared": resolve(__dirname, "../shared/src"),
    },
  },
});
