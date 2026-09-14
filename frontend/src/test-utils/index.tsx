/**
 * Shared scaffolding for the test suite: builders for the app's data shapes, a
 * way to put data in storage before a render, and a render that wraps the tree
 * in the same providers `app/_layout.tsx` does.
 */
import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  act,
  render,
  RenderOptions,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react-native";
import { AppData, Ingredient, ManualItem, Recipe, Step } from "../types/app";
import { STORAGE_KEY } from "../constants/storage";
import { AppDataProvider } from "../context/AppDataContext";
import { NoticeProvider } from "../context/NoticeContext";
import { emptyAppData } from "../utils/recipes";

let idCounter = 0;

/** A predictable id, so tests can assert on one without reading it back. */
export function testId(prefix = "id"): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function makeIngredient(
  overrides: Partial<Ingredient> = {}
): Ingredient {
  return { amount: 100, name: "flour", unit: "g", ...overrides };
}

export function makeStep(overrides: Partial<Step> = {}): Step {
  return { description: "Mix it all together", order: 1, ...overrides };
}

export function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    description: "A simple bake",
    id: testId("recipe"),
    ingredients: [makeIngredient()],
    people_served: 2,
    steps: [makeStep()],
    times_cooked: 0,
    title: "Test loaf",
    ...overrides,
  };
}

export function makeManualItem(
  overrides: Partial<ManualItem> = {}
): ManualItem {
  return { id: testId("manual"), name: "bin bags", ...overrides };
}

export function makeAppData(overrides: Partial<AppData> = {}): AppData {
  return { ...emptyAppData(), ...overrides };
}

/** Writes app data to storage so the provider reads it on mount. */
export async function seedStorage(
  overrides: Partial<AppData> = {}
): Promise<AppData> {
  const data = makeAppData(overrides);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

/** Reads back what the provider has written, as the app will next load it. */
export async function readStorage(): Promise<AppData | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

const Providers = ({ children }: { children: React.ReactNode }) => (
  <AppDataProvider>
    <NoticeProvider>{children}</NoticeProvider>
  </AppDataProvider>
);

/** Renders inside the app's providers, exactly as the root layout does. */
export function renderWithProviders(
  ui: React.ReactElement,
  options: Omit<RenderOptions, "wrapper"> = {}
) {
  return render(ui, { wrapper: Providers, ...options });
}

/**
 * Lets the provider's first read of storage land.
 *
 * Screens that do not gate on `loading`, such as the add-recipe form, are drawn
 * and usable before it does, and the app only writes once it has read. A test
 * that acts on such a screen has to wait, exactly as a real user does.
 */
export async function flushHydration(): Promise<void> {
  await act(async () => {});
}

/**
 * Waits for the provider's first read of storage to finish. Screens show the
 * loading spinner until then, so anything that renders stored data needs this.
 */
export async function waitForLoad(): Promise<void> {
  const spinner = screen.queryByTestId("loading-screen");
  if (spinner) await waitForElementToBeRemoved(() => screen.queryByTestId("loading-screen"));
}
