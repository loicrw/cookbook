/**
 * Stands in for expo-router in every test.
 *
 * Jest picks this up automatically because it sits next to `node_modules`, so
 * no test has to call `jest.mock("expo-router")`.
 *
 * Navigators render their children and record what each `Screen` was declared
 * with, which is the whole of what a layout file does, so the layouts can be
 * asserted on without a real navigation tree.
 */
import React from "react";
import { View } from "react-native";

export const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  dismissAll: jest.fn(),
  navigate: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  setParams: jest.fn(),
};

export const router = mockRouter;
export const useRouter = jest.fn(() => mockRouter);
export const useLocalSearchParams = jest.fn(() => ({}) as Record<string, string>);
export const useGlobalSearchParams = useLocalSearchParams;
export const usePathname = jest.fn(() => "/");
export const useSegments = jest.fn(() => [] as string[]);
export const useNavigation = jest.fn(() => ({ setOptions: jest.fn() }));
export const useFocusEffect = jest.fn();

type ScreenProps = { name?: string; options?: Record<string, any> };

/** What every declared screen was configured with, keyed by its route name. */
export const registeredScreens = new Map<string, ScreenProps>();
/** The props each navigator itself was given, keyed by navigator kind. */
export const navigatorProps = new Map<string, Record<string, any>>();

/** Key used for a bare `<Stack.Screen options={...} />` inside a screen. */
export const CURRENT_SCREEN = "__current";

function createNavigator(kind: "stack" | "tabs") {
  const Navigator = ({
    children,
    ...rest
  }: {
    children?: React.ReactNode;
  } & Record<string, any>) => {
    navigatorProps.set(kind, rest);
    return <View testID={`${kind}-navigator`}>{children}</View>;
  };

  Navigator.displayName = kind === "stack" ? "Stack" : "Tabs";
  Navigator.Screen = ({ name, options }: ScreenProps) => {
    registeredScreens.set(name ?? CURRENT_SCREEN, { name, options });
    return null;
  };

  return Navigator;
}

export const Stack = createNavigator("stack");
export const Tabs = createNavigator("tabs");

export const Link = ({ children }: { children?: React.ReactNode }) => (
  <View>{children}</View>
);

/** Clears what the navigators recorded. Call it between tests. */
export function resetRouterMock(): void {
  registeredScreens.clear();
  navigatorProps.clear();
  useLocalSearchParams.mockReturnValue({});
  useRouter.mockReturnValue(mockRouter);
  // A return value set by one test outlives `clearAllMocks`, so it is put back.
  mockRouter.canGoBack.mockReturnValue(true);
}
