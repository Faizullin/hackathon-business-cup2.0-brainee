import sharedConfig from "@brainee/config/vitest";
import { mergeConfig } from "vitest/config";

export default mergeConfig(sharedConfig, {
  test: { env: { BRAINEE_SHARED_DEMO: "1" }, testTimeout: 20_000, passWithNoTests: false },
});
