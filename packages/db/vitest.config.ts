import sharedConfig from "@brainee/config/vitest";
import { mergeConfig } from "vitest/config";

export default mergeConfig(sharedConfig, { test: { testTimeout: 20_000, passWithNoTests: false } });
