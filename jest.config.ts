import type { Config } from "@jest/types";

// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  modulePaths: ["<rootDir>"],
  testPathIgnorePatterns: ["node_modules", "dist"],
};

export default config;
