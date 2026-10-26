import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname), "server-only": path.resolve(__dirname, "lib/test/server-only-stub.ts") },
  },
  test: { include: ["lib/**/*.test.ts"], testTimeout: 30000 },
});
