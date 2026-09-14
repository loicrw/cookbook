/**
 * Typed access to the expo-router mock in `__mocks__/expo-router.tsx`.
 *
 * Jest swaps that file in for expo-router automatically, but TypeScript still
 * sees the real package, which has no `mockRouter` or `registeredScreens`. This
 * reaches the same module instance the app imports, typed as what it actually
 * is at test time, so no test has to cast.
 */
import * as ExpoRouter from "expo-router";

type RouterMock = typeof import("../../__mocks__/expo-router");

const mock = ExpoRouter as unknown as RouterMock;

export const CURRENT_SCREEN = mock.CURRENT_SCREEN;
export const mockRouter = mock.mockRouter;
export const navigatorProps = mock.navigatorProps;
export const registeredScreens = mock.registeredScreens;
export const resetRouterMock = mock.resetRouterMock;

/** Sets the route parameters the screen under test will read. */
export function setSearchParams(params: Record<string, string>): void {
  mock.useLocalSearchParams.mockReturnValue(params);
}
