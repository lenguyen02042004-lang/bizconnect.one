// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    // @ts-expect-error — UserConfig from @lovable.dev/vite-tanstack-config doesn't expose `test`,
    // but Vitest reads it correctly at runtime via vite.config.ts merge.
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/vitest.setup.ts",
      exclude: ["tests/**", "node_modules/**"],
    },
  },
});
