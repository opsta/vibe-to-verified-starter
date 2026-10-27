import { defineConfig } from "vitest/config";

// Rules tests need the Firestore emulator; run via `npm run test:rules:emu`.
export default defineConfig({
  test: { include: ["test-rules/**/*.test.ts"], fileParallelism: false },
});
