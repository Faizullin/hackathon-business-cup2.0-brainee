import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // Empty scaffold packages gain real tests with their P2 implementation.
    passWithNoTests: true,
  },
});
