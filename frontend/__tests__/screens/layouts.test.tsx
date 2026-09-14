import React from "react";
import { Text as RNText } from "react-native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import {
  mockRouter,
  navigatorProps,
  registeredScreens,
  resetRouterMock,
} from "@/src/test-utils/router";
import RootLayout from "@/app/_layout";
import TabsLayout from "@/app/(tabs)/_layout";
import RecipeLayout from "@/app/(tabs)/recipe/_layout";
import Root from "@/app/+html";
import { FONT_SIZE_LEVELS } from "@/src/constants/settings";
import { theme } from "@/src/styles/common";
import { renderWithProviders, seedStorage } from "@/src/test-utils";

beforeEach(() => resetRouterMock());

describe("the root layout", () => {
  it("puts the whole app inside the providers", () => {
    render(<RootLayout />);

    expect(screen.getByTestId("stack-navigator")).toBeVisible();
  });

  it("hides its own header, the tabs bringing their own", () => {
    render(<RootLayout />);

    expect(registeredScreens.get("(tabs)")?.options).toEqual({
      headerShown: false,
    });
  });
});

describe("the tab bar", () => {
  it("offers the four tabs, in the order they are declared", async () => {
    renderWithProviders(<TabsLayout />);

    await waitFor(() => expect(screen.getByTestId("tabs-navigator")).toBeVisible());
    expect([...registeredScreens.keys()]).toEqual([
      "settings",
      "basket",
      "add",
      "index",
      "recipe",
    ]);
  });

  it("names each tab", async () => {
    renderWithProviders(<TabsLayout />);

    await waitFor(() => expect(screen.getByTestId("tabs-navigator")).toBeVisible());
    expect(registeredScreens.get("settings")?.options?.title).toBe("Settings");
    expect(registeredScreens.get("basket")?.options?.title).toBe("Basket");
    expect(registeredScreens.get("add")?.options?.title).toBe("Add recipe");
    expect(registeredScreens.get("index")?.options?.title).toBe("Recipes");
  });

  it("keeps the recipe stack out of the bar without leaving the tabs", async () => {
    renderWithProviders(<TabsLayout />);

    await waitFor(() => expect(screen.getByTestId("tabs-navigator")).toBeVisible());
    expect(registeredScreens.get("recipe")?.options).toEqual({
      headerShown: false,
      href: null,
    });
  });

  it("heads the cookbook plainly when no name is set", async () => {
    renderWithProviders(<TabsLayout />);

    await waitFor(() =>
      expect(registeredScreens.get("index")?.options?.headerTitle).toBe(
        "Recipes"
      )
    );
  });

  it("puts the cook's name on the cookbook, but not on the tab", async () => {
    await seedStorage({ settings: { authorName: "Nonna", fontSizeLevel: 2 } });
    renderWithProviders(<TabsLayout />);

    await waitFor(() =>
      expect(registeredScreens.get("index")?.options?.headerTitle).toBe(
        "Nonna's Recipes"
      )
    );
    expect(registeredScreens.get("index")?.options?.title).toBe("Recipes");
  });

  it("goes back to the tab that was open before, not to the first one", async () => {
    renderWithProviders(<TabsLayout />);

    await waitFor(() =>
      expect(navigatorProps.get("tabs")?.backBehavior).toBe("history")
    );
  });

  it("grows the bar and its labels with the letter size", async () => {
    await seedStorage({ settings: { authorName: "", fontSizeLevel: 4 } });
    renderWithProviders(<TabsLayout />);

    const scale = FONT_SIZE_LEVELS[4].scale;
    await waitFor(() =>
      expect(
        navigatorProps.get("tabs")?.screenOptions.tabBarLabelStyle.fontSize
      ).toBe(Math.round(11 * scale))
    );
    expect(
      navigatorProps.get("tabs")?.screenOptions.tabBarStyle.height
    ).toBeGreaterThan(Math.round(54 * scale));
  });

  it("lifts the bar clear of the bottom edge", async () => {
    renderWithProviders(<TabsLayout />);

    await waitFor(() => {
      const { tabBarStyle } = navigatorProps.get("tabs")!.screenOptions;
      expect(tabBarStyle.paddingBottom).toBeGreaterThan(0);
      expect(tabBarStyle.height).toBeGreaterThan(tabBarStyle.paddingBottom);
    });
  });

  it("gives every tab an icon", async () => {
    renderWithProviders(<TabsLayout />);

    await waitFor(() => expect(screen.getByTestId("tabs-navigator")).toBeVisible());

    for (const name of ["settings", "basket", "add", "index"]) {
      const { tabBarIcon } = registeredScreens.get(name)!.options!;
      const icon = tabBarIcon({ color: theme.muted, size: 24 });
      expect(icon.props.name).toMatch(/-outline$/);
      expect(icon.props.color).toBe(theme.muted);
    }
  });

  it("grows the tab icons with the letter size, as the labels do", async () => {
    await seedStorage({ settings: { authorName: "", fontSizeLevel: 4 } });
    renderWithProviders(<TabsLayout />);

    await waitFor(() =>
      expect(
        registeredScreens
          .get("index")!
          .options!.tabBarIcon({ color: theme.muted, size: 24 }).props.size
      ).toBe(Math.round(24 * FONT_SIZE_LEVELS[4].scale))
    );
  });

  it("paints the bar in the app's colours", async () => {
    renderWithProviders(<TabsLayout />);

    await waitFor(() => {
      const options = navigatorProps.get("tabs")!.screenOptions;
      expect(options.tabBarActiveTintColor).toBe(theme.primary);
      expect(options.tabBarInactiveTintColor).toBe(theme.muted);
      expect(options.tabBarStyle.backgroundColor).toBe(theme.surface);
    });
  });
});

describe("the recipe stack", () => {
  it("holds the recipe and its edit screen", async () => {
    renderWithProviders(<RecipeLayout />);

    await waitFor(() =>
      expect(screen.getByTestId("stack-navigator")).toBeVisible()
    );
    expect([...registeredScreens.keys()]).toEqual(["[id]/index", "[id]/edit"]);
    expect(registeredScreens.get("[id]/edit")?.options?.title).toBe(
      "Edit recipe"
    );
  });

  it("spells out the way back from the first screen of the stack", async () => {
    renderWithProviders(<RecipeLayout />);

    await waitFor(() =>
      expect(screen.getByTestId("stack-navigator")).toBeVisible()
    );

    const { headerLeft } = registeredScreens.get("[id]/index")!.options!;
    renderWithProviders(headerLeft());

    const back = screen.getByRole("button", { name: "Back to recipes" });
    expect(back).toBeVisible();

    fireEvent.press(back);

    // Popping the stack would land on whichever tab comes first, not on the
    // cookbook the user came from, so this navigates rather than going back.
    expect(mockRouter.navigate).toHaveBeenCalledWith("/");
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it("grows its header with the letter size", async () => {
    await seedStorage({ settings: { authorName: "", fontSizeLevel: 0 } });
    renderWithProviders(<RecipeLayout />);

    await waitFor(() =>
      expect(
        navigatorProps.get("stack")?.screenOptions.headerTitleStyle.fontSize
      ).toBe(Math.round(17 * FONT_SIZE_LEVELS[0].scale))
    );
  });
});

describe("the web page the app is served in", () => {
  /**
   * `+html.tsx` is a document, built from DOM tags rather than React Native
   * ones, so it is read as an element tree rather than rendered.
   */
  const flatten = (node: React.ReactNode): React.ReactElement[] =>
    React.Children.toArray(node).flatMap((child) =>
      React.isValidElement(child)
        ? [child, ...flatten((child.props as { children?: React.ReactNode }).children)]
        : []
    );

  const document = flatten(
    Root({ children: <RNText>App</RNText> }) as React.ReactElement
  );

  const find = (type: string, props: Record<string, string>) =>
    document.find(
      (element) =>
        element.type === type &&
        Object.entries(props).every(
          ([key, value]) =>
            (element.props as Record<string, unknown>)[key] === value
        )
    );

  it("sets the viewport, so the app is laid out at the device's width", () => {
    expect(find("meta", { name: "viewport" })?.props).toMatchObject({
      content: "width=device-width, initial-scale=1, shrink-to-fit=no",
    });
  });

  it("declares the icon iOS needs to install the app properly", () => {
    // iOS reads only apple-touch-icon; without it the home screen shows a tile.
    expect(
      find("link", { rel: "apple-touch-icon" })?.props
    ).toMatchObject({ href: "/cookbook/apple-touch-icon.png", sizes: "180x180" });
  });

  it("points at the manifest the other platforms install from", () => {
    expect(find("link", { rel: "manifest" })?.props).toMatchObject({
      href: "/cookbook/manifest.json",
    });
  });

  it("prefixes the static files with the path the app is served from", () => {
    for (const element of document) {
      const href = (element.props as { href?: string }).href;
      if (href) expect(href.startsWith("/cookbook/")).toBe(true);
    }
  });

  it("asks iOS to run it as an app rather than in a browser", () => {
    expect(
      find("meta", { name: "apple-mobile-web-app-capable" })?.props
    ).toMatchObject({ content: "yes" });
    expect(
      find("meta", { name: "apple-mobile-web-app-title" })?.props
    ).toMatchObject({ content: "My Cookbook" });
  });

  it("puts the app itself in the body", () => {
    const body = document.find((element) => element.type === "body");
    expect(body).toBeDefined();
  });
});
