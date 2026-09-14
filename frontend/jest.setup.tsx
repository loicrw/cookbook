/**
 * Runs before every test file.
 *
 * Only the platform edges are mocked here: device storage, the safe area, and
 * the app manifest. Everything the app itself owns is exercised for real, so a
 * test failing means the app is wrong rather than a mock being out of date.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// The library ships its mock as a default export, so it has to be unwrapped or
// every named import from it comes back undefined.
jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock").default
);

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.0.0" } },
}));

// Silences the "not wrapped in act" style noise React logs for state that
// settles after a test has made its assertions. Real failures still throw.
const consoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation((...args) => {
    if (typeof args[0] === "string" && args[0].includes("not wrapped in act")) {
      return;
    }
    consoleError(...args);
  });
});

// The AsyncStorage mock keeps its contents for the whole file otherwise, so one
// test's cookbook would leak into the next. Clearing on the way in as well as
// on the way out covers a provider that finished hydrating after its test did.
beforeEach(async () => {
  await AsyncStorage.clear();
});

afterEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});
