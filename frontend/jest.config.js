/**
 * The `jest-expo` preset supplies the React Native transform, the asset
 * transform and a moduleNameMapper built from the `@/` paths in tsconfig.json,
 * so tests import exactly what the app imports.
 */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.tsx"],
  // `dist/` holds the exported web bundle, and `.expo/` generated types.
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/dist/",
    "<rootDir>/.expo/",
  ],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "src/**/*.{ts,tsx}",
    // Type-only: nothing to execute, so it would sit at 0% for ever.
    "!src/types/**",
    // Re-export barrel, covered through the modules it points at.
    "!src/components/index.ts",
    "!**/__tests__/**",
    "!src/test-utils/**",
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },
};
