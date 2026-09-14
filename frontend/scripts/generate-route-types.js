/**
 * Regenerates .expo/types/router.d.ts, the typed-routes declaration that backs
 * `router.push(...)` autocompletion and type checking.
 *
 * Expo only rebuilds this file from the Metro dev server, so a `tsc --noEmit`
 * run on a fresh checkout (or in CI) fails against a stale route list. This
 * calls the same generator the dev server uses, without starting it.
 */
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, ".expo", "types");

// The generator reads the app directory from this variable at import time.
process.env.EXPO_ROUTER_APP_ROOT = path.join(projectRoot, "app");

const {
  regenerateDeclarations,
} = require("expo-router/build/typed-routes/index.js");

fs.mkdirSync(outputDir, { recursive: true });

// regenerateDeclarations is debounced internally; its pending timer keeps the
// process alive until the file has actually been written.
regenerateDeclarations(outputDir);
