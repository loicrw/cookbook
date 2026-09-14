import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { FONT_SIZE_LEVELS } from "../../constants/settings";
import { STORAGE_KEY } from "../../constants/storage";
import { Recipe } from "../../types/app";
import { ingredientKey } from "../../utils/recipes";
import {
  makeManualItem,
  makeRecipe,
  readStorage,
  seedStorage,
} from "../../test-utils";
import {
  AppDataProvider,
  useBasket,
  useRecipes,
  useSettings,
} from "../AppDataContext";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppDataProvider>{children}</AppDataProvider>
);

/** Renders a hook and waits for the first read of storage to land. */
async function renderLoaded<T>(hook: () => T) {
  const view = renderHook(hook, { wrapper });
  await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());
  return view;
}

const bread = makeRecipe({
  id: "bread",
  ingredients: [
    { amount: 500, name: "flour", unit: "g" },
    { amount: "to taste", name: "salt" },
  ],
  people_served: 4,
  tags: ["baking"],
  title: "Bread",
});

const cake = makeRecipe({
  id: "cake",
  ingredients: [{ amount: 100, name: "flour", unit: "g" }],
  people_served: 2,
  tags: ["Baking", "sweet"],
  title: "Cake",
});

const flourKey = ingredientKey({ amount: 1, name: "flour", unit: "g" });

describe("AppDataProvider", () => {
  it("reports loading until storage has been read", async () => {
    await seedStorage({ recipes: [bread] });
    const { result } = renderHook(() => useRecipes(), { wrapper });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.recipes).toHaveLength(1);
  });

  it("starts empty when nothing has ever been stored", async () => {
    const { result } = await renderLoaded(() => useRecipes());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.recipes).toEqual([]);
  });

  it("does not write anything before it has read", async () => {
    await seedStorage({ recipes: [bread] });
    (AsyncStorage.setItem as jest.Mock).mockClear();

    const { result } = renderHook(() => useRecipes(), { wrapper });

    // The placeholder state must never reach storage: it would wipe the
    // cookbook before the real one has been read back.
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.recipes).toHaveLength(1);
  });

  it("writes every change back to storage", async () => {
    const { result } = await renderLoaded(() => useRecipes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.addRecipe(cake));

    await waitFor(async () =>
      expect((await readStorage())?.recipes).toHaveLength(1)
    );
  });

  it("stamps the moment of every change", async () => {
    await seedStorage({ lastUpdated: 1 });
    const { result } = await renderLoaded(() => useRecipes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.addRecipe(cake));

    await waitFor(async () =>
      expect((await readStorage())?.lastUpdated).toBeGreaterThan(1)
    );
  });

  it("keeps working when a write fails", async () => {
    const logged = jest.spyOn(console, "error").mockImplementation(() => {});
    // Once, not for good: AsyncStorage is already a mock, so replacing its
    // implementation outright would leave it broken for the tests after this.
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
      new Error("disk full")
    );

    const { result } = await renderLoaded(() => useRecipes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.addRecipe(cake));

    // The write failed, but the cookbook on screen is still the new one.
    await waitFor(() => expect(result.current.recipes).toHaveLength(1));

    logged.mockRestore();
  });

  it("refuses to hand out data outside a provider", () => {
    const logged = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useRecipes())).toThrow(
      "App data hooks must be used inside an AppDataProvider"
    );

    logged.mockRestore();
  });
});

describe("useRecipes", () => {
  it("offers the tags, names and units already in the cookbook", async () => {
    await seedStorage({ recipes: [bread, cake] });
    const { result } = await renderLoaded(() => useRecipes());
    await waitFor(() => expect(result.current.recipes).toHaveLength(2));

    expect(result.current.allTags).toEqual(["baking", "sweet"]);
    expect(result.current.allIngredientNames).toEqual(["flour", "salt"]);
    expect(result.current.allUnits).toEqual(["g"]);
  });

  it("puts a new recipe at the top, where the newest belongs", async () => {
    await seedStorage({ recipes: [bread] });
    const { result } = await renderLoaded(() => useRecipes());
    await waitFor(() => expect(result.current.recipes).toHaveLength(1));

    act(() => result.current.addRecipe(cake));

    expect(result.current.recipes.map((r) => r.id)).toEqual(["cake", "bread"]);
  });

  it("finds a recipe by id, and nothing for one that is gone", async () => {
    await seedStorage({ recipes: [bread] });
    const { result } = await renderLoaded(() => useRecipes());
    await waitFor(() => expect(result.current.recipes).toHaveLength(1));

    expect(result.current.getRecipe("bread")?.title).toBe("Bread");
    expect(result.current.getRecipe("nope")).toBeUndefined();
  });

  it("appends imported recipes, re-issuing any id already in use", async () => {
    await seedStorage({ recipes: [bread] });
    const { result } = await renderLoaded(() => useRecipes());
    await waitFor(() => expect(result.current.recipes).toHaveLength(1));

    act(() =>
      result.current.appendRecipes([
        makeRecipe({ id: "bread", title: "Another bread" }),
      ])
    );

    expect(result.current.recipes).toHaveLength(2);
    expect(new Set(result.current.recipes.map((r) => r.id)).size).toBe(2);
    expect(result.current.recipes[0].title).toBe("Bread");
  });

  it("replaces the cookbook, and takes its recipes off the basket with it", async () => {
    const manual = makeManualItem();
    await seedStorage({
      basket: {
        entries: [{ recipeId: "bread", servings: 4 }],
        manualItems: [manual],
        ticked: [flourKey],
      },
      recipes: [bread],
    });

    const { result } = await renderLoaded(() => ({
      basket: useBasket(),
      recipes: useRecipes(),
    }));
    await waitFor(() => expect(result.current.recipes.recipes).toHaveLength(1));

    act(() => result.current.recipes.replaceRecipes([cake]));

    expect(result.current.recipes.recipes.map((r) => r.id)).toEqual(["cake"]);
    expect(result.current.basket.items).toEqual([]);
    // Lines added by hand belong to no recipe, so they survive.
    expect(result.current.basket.manualItems).toEqual([manual]);
    expect(result.current.basket.ticked.has(flourKey)).toBe(false);
  });

  it("edits a recipe in place, leaving the others alone", async () => {
    await seedStorage({ recipes: [bread, cake] });
    const { result } = await renderLoaded(() => useRecipes());
    await waitFor(() => expect(result.current.recipes).toHaveLength(2));

    act(() =>
      result.current.updateRecipe({ ...bread, title: "Sourdough" } as Recipe)
    );

    expect(result.current.getRecipe("bread")?.title).toBe("Sourdough");
    expect(result.current.getRecipe("cake")?.title).toBe("Cake");
  });

  it("deletes a recipe, and takes it off the basket with it", async () => {
    await seedStorage({
      basket: {
        entries: [
          { recipeId: "bread", servings: 4 },
          { recipeId: "cake", servings: 2 },
        ],
        manualItems: [],
        ticked: [flourKey],
      },
      recipes: [bread, cake],
    });

    const { result } = await renderLoaded(() => ({
      basket: useBasket(),
      recipes: useRecipes(),
    }));
    await waitFor(() => expect(result.current.recipes.recipes).toHaveLength(2));

    act(() => result.current.recipes.deleteRecipe("bread"));

    expect(result.current.recipes.recipes.map((r) => r.id)).toEqual(["cake"]);
    expect(result.current.basket.items.map((i) => i.recipe.id)).toEqual([
      "cake",
    ]);
    // Cake still asks for flour, so that tick is still on a line that exists.
    expect(result.current.basket.ticked.has(flourKey)).toBe(true);
  });

  it("drops the ticks of lines a deletion takes off the list", async () => {
    await seedStorage({
      basket: {
        entries: [{ recipeId: "bread", servings: 4 }],
        manualItems: [],
        ticked: [flourKey],
      },
      recipes: [bread],
    });

    const { result } = await renderLoaded(() => ({
      basket: useBasket(),
      recipes: useRecipes(),
    }));
    await waitFor(() => expect(result.current.recipes.recipes).toHaveLength(1));

    act(() => result.current.recipes.deleteRecipe("bread"));

    expect(result.current.basket.ticked.size).toBe(0);
  });

  it("records a cooking against the recipe, as of now", async () => {
    await seedStorage({ recipes: [bread] });
    const { result } = await renderLoaded(() => useRecipes());
    await waitFor(() => expect(result.current.recipes).toHaveLength(1));

    act(() => result.current.markCooked("bread"));

    const cooked = result.current.getRecipe("bread");
    expect(cooked?.times_cooked).toBe(1);
    expect(Date.parse(cooked?.last_cooked_on ?? "")).not.toBeNaN();

    act(() => result.current.markCooked("bread"));
    expect(result.current.getRecipe("bread")?.times_cooked).toBe(2);
  });

  it("ignores a cooking logged against a recipe that is gone", async () => {
    await seedStorage({ recipes: [bread] });
    const { result } = await renderLoaded(() => useRecipes());
    await waitFor(() => expect(result.current.recipes).toHaveLength(1));

    act(() => result.current.markCooked("nope"));

    expect(result.current.getRecipe("bread")?.times_cooked).toBe(0);
  });
});

describe("useBasket", () => {
  const seedBasket = () =>
    seedStorage({
      basket: {
        entries: [{ recipeId: "bread", servings: 4 }],
        manualItems: [],
        ticked: [],
      },
      recipes: [bread, cake],
    });

  it("lists the recipes on the list with the servings they were added for", async () => {
    await seedBasket();
    const { result } = await renderLoaded(() => useBasket());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    expect(result.current.items[0].recipe.title).toBe("Bread");
    expect(result.current.items[0].servings).toBe(4);
    expect(result.current.servingsFor("bread")).toBe(4);
    expect(result.current.servingsFor("cake")).toBeUndefined();
  });

  it("derives the shopping list from the cookbook, scaled and merged", async () => {
    await seedBasket();
    const { result } = await renderLoaded(() => useBasket());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => result.current.addRecipe("cake", 4));

    expect(result.current.ingredients).toEqual([
      // 500 g for 4 of bread, plus 100 g doubled for 4 of cake.
      { amount: 700, name: "flour", unit: "g" },
      { amount: "to taste", name: "salt" },
    ]);
  });

  it("restates a recipe already on the list rather than adding it twice", async () => {
    await seedBasket();
    const { result } = await renderLoaded(() => useBasket());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => result.current.addRecipe("bread", 8));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.servingsFor("bread")).toBe(8);
  });

  it("never shops for less than one serving", async () => {
    await seedBasket();
    const { result } = await renderLoaded(() => useBasket());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => result.current.addRecipe("bread", 0));

    expect(result.current.servingsFor("bread")).toBe(1);
  });

  it("removes a recipe from the list", async () => {
    await seedBasket();
    const { result } = await renderLoaded(() => useBasket());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => result.current.removeRecipe("bread"));

    expect(result.current.items).toEqual([]);
    expect(result.current.ingredients).toEqual([]);
  });

  it("puts a line on the list by hand, with or without measurements", async () => {
    const { result } = await renderLoaded(() => useBasket());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() =>
      result.current.addManualItem({ amount: 2, name: " potatoes ", unit: " kg " })
    );
    act(() => result.current.addManualItem({ name: "bin bags" }));

    expect(result.current.manualItems).toEqual([
      { amount: 2, id: expect.any(String), name: "potatoes", unit: "kg" },
      { id: expect.any(String), name: "bin bags" },
    ]);
  });

  it("leaves out an amount that is not a real measurement", async () => {
    const { result } = await renderLoaded(() => useBasket());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.addManualItem({ amount: 0, name: "salt" }));

    expect(result.current.manualItems[0]).not.toHaveProperty("amount");
  });

  it("removes a hand-added line by its id", async () => {
    const { result } = await renderLoaded(() => useBasket());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.addManualItem({ name: "bin bags" }));
    const { id } = result.current.manualItems[0];
    act(() => result.current.removeManualItem(id));

    expect(result.current.manualItems).toEqual([]);
  });

  it("ticks a line off and back on again", async () => {
    await seedBasket();
    const { result } = await renderLoaded(() => useBasket());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => result.current.toggleTicked(flourKey));
    expect(result.current.ticked.has(flourKey)).toBe(true);

    act(() => result.current.toggleTicked(flourKey));
    expect(result.current.ticked.has(flourKey)).toBe(false);
  });

  it("keeps the ticks of hand-added lines apart from the recipe ones", async () => {
    await seedBasket();
    const { result } = await renderLoaded(() => useBasket());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => result.current.addManualItem({ name: "flour" }));
    const manualKey = `manual:${result.current.manualItems[0].id}`;

    act(() => result.current.toggleTicked(manualKey));

    expect(result.current.ticked.has(manualKey)).toBe(true);
    expect(result.current.ticked.has(flourKey)).toBe(false);
  });

  it("drops a tick when the line it belongs to leaves the list", async () => {
    await seedBasket();
    const { result } = await renderLoaded(() => useBasket());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => result.current.toggleTicked(flourKey));
    act(() => result.current.removeRecipe("bread"));

    expect(result.current.ticked.size).toBe(0);
  });

  it("empties the whole list when the shop is done", async () => {
    await seedBasket();
    const { result } = await renderLoaded(() => useBasket());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => result.current.addManualItem({ name: "bin bags" }));
    act(() => result.current.toggleTicked(flourKey));
    act(() => result.current.clear());

    expect(result.current.items).toEqual([]);
    expect(result.current.manualItems).toEqual([]);
    expect(result.current.ticked.size).toBe(0);
  });

  it("survives a reload part-way through a shop", async () => {
    await seedBasket();
    const first = await renderLoaded(() => useBasket());
    await waitFor(() => expect(first.result.current.items).toHaveLength(1));

    act(() => first.result.current.toggleTicked(flourKey));
    await waitFor(async () =>
      expect((await readStorage())?.basket.ticked).toEqual([flourKey])
    );
    first.unmount();

    const second = await renderLoaded(() => useBasket());
    await waitFor(() =>
      expect(second.result.current.ticked.has(flourKey)).toBe(true)
    );
  });
});

describe("useSettings", () => {
  it("turns the stored level into the scale the text is drawn at", async () => {
    await seedStorage({ settings: { authorName: "", fontSizeLevel: 4 } });
    const { result } = await renderLoaded(() => useSettings());

    await waitFor(() =>
      expect(result.current.fontScale).toBe(FONT_SIZE_LEVELS[4].scale)
    );
  });

  it("records the name the cookbook belongs to", async () => {
    const { result } = await renderLoaded(() => useSettings());

    act(() => result.current.setAuthorName("Nonna"));

    expect(result.current.settings.authorName).toBe("Nonna");
    await waitFor(async () =>
      expect((await readStorage())?.settings.authorName).toBe("Nonna")
    );
  });

  it("changes the letter size without touching the name", async () => {
    await seedStorage({ settings: { authorName: "Nonna", fontSizeLevel: 2 } });
    const { result } = await renderLoaded(() => useSettings());
    await waitFor(() =>
      expect(result.current.settings.authorName).toBe("Nonna")
    );

    act(() => result.current.setFontSizeLevel(0));

    expect(result.current.settings.fontSizeLevel).toBe(0);
    expect(result.current.settings.authorName).toBe("Nonna");
    expect(result.current.fontScale).toBe(FONT_SIZE_LEVELS[0].scale);
  });

  it("leaves the recipes alone when a preference changes", async () => {
    await seedStorage({ recipes: [bread] });
    const { result } = await renderLoaded(() => ({
      recipes: useRecipes(),
      settings: useSettings(),
    }));
    await waitFor(() => expect(result.current.recipes.recipes).toHaveLength(1));

    act(() => result.current.settings.setFontSizeLevel(4));

    expect(result.current.recipes.recipes).toHaveLength(1);
  });
});

describe("what reaches storage", () => {
  it("writes the whole payload, ready for the next load", async () => {
    const { result } = await renderLoaded(() => ({
      basket: useBasket(),
      recipes: useRecipes(),
      settings: useSettings(),
    }));
    await waitFor(() => expect(result.current.recipes.loading).toBe(false));

    act(() => result.current.recipes.addRecipe(bread));
    act(() => result.current.basket.addRecipe("bread", 4));
    act(() => result.current.settings.setAuthorName("Nonna"));

    await waitFor(async () => {
      const stored = await readStorage();
      expect(stored).toMatchObject({
        basket: { entries: [{ recipeId: "bread", servings: 4 }] },
        recipes: [expect.objectContaining({ id: "bread" })],
        settings: { authorName: "Nonna" },
      });
    });

    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeTruthy();
  });
});
