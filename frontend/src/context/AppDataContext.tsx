import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AppData,
  AppSettings,
  BasketEntry,
  Ingredient,
  Recipe,
} from "../types/app";
import { FONT_SIZE_LEVELS } from "../constants/settings";
import { loadAppData, saveAppData } from "../utils/local_storage";
import {
  basketIngredients,
  collectIngredientNames,
  collectTags,
  collectUnits,
  emptyAppData,
  emptyBasket,
  ingredientKey,
  withUniqueIds,
} from "../utils/recipes";

/**
 * Everything the app persists lives in one stored blob, so one provider owns it.
 * Screens read it through the narrower `useRecipes`, `useBasket` and
 * `useSettings` hooks rather than touching the whole payload.
 */
type Store = {
  appData: AppData;
  loading: boolean;
  /** Merges a patch into the stored data and stamps `lastUpdated`. */
  update: (patch: (current: AppData) => Partial<AppData>) => void;
};

const AppDataContext = createContext<Store | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [appData, setAppData] = useState<AppData>(emptyAppData);
  const [loading, setLoading] = useState(true);
  // Skips the write that would otherwise fire for the initial placeholder state
  // and overwrite stored data before it has been read.
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;

    loadAppData().then((saved) => {
      if (cancelled) return;
      setAppData(saved);
      hydrated.current = true;
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    saveAppData(appData).catch(() => {
      // saveAppData already logs; a failed write must not break the UI.
    });
  }, [appData]);

  const update = useCallback<Store["update"]>((patch) => {
    setAppData((previous) => ({
      ...previous,
      ...patch(previous),
      lastUpdated: Date.now(),
    }));
  }, []);

  const value = useMemo<Store>(
    () => ({ appData, loading, update }),
    [appData, loading, update]
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

function useStore(): Store {
  const store = useContext(AppDataContext);
  if (!store) {
    throw new Error("App data hooks must be used inside an AppDataProvider");
  }
  return store;
}

type RecipesValue = {
  /** Ingredient names already used in the cookbook, for the form autocomplete. */
  allIngredientNames: string[];
  /** Every tag already used in the cookbook, for the tag autocomplete. */
  allTags: string[];
  /** Units already used in the cookbook, for the form autocomplete. */
  allUnits: string[];
  /** True until the first read from storage has finished. */
  loading: boolean;
  recipes: Recipe[];
  addRecipe: (recipe: Recipe) => void;
  appendRecipes: (incoming: Recipe[]) => void;
  deleteRecipe: (id: string) => void;
  getRecipe: (id: string) => Recipe | undefined;
  /** Records one more cooking of a recipe, as of now. */
  markCooked: (id: string) => void;
  replaceRecipes: (incoming: Recipe[]) => void;
  updateRecipe: (recipe: Recipe) => void;
};

export function useRecipes(): RecipesValue {
  const { appData, loading, update } = useStore();
  const { recipes } = appData;

  return useMemo<RecipesValue>(() => {
    const mutate = (next: (current: Recipe[]) => Recipe[]) =>
      update((current) => ({ recipes: next(current.recipes) }));

    return {
      allIngredientNames: collectIngredientNames(recipes),
      allTags: collectTags(recipes),
      allUnits: collectUnits(recipes),
      loading,
      recipes,
      addRecipe: (recipe) => mutate((current) => [recipe, ...current]),
      appendRecipes: (incoming) =>
        mutate((current) => withUniqueIds([...current, ...incoming])),
      deleteRecipe: (id) =>
        update((current) => {
          const recipes = current.recipes.filter((recipe) => recipe.id !== id);
          const entries = current.basket.entries.filter(
            (entry) => entry.recipeId !== id
          );
          return {
            basket: prunedBasket(recipes, entries, current.basket.ticked),
            recipes,
          };
        }),
      getRecipe: (id) => recipes.find((recipe) => recipe.id === id),
      markCooked: (id) =>
        mutate((current) =>
          current.map((recipe) =>
            recipe.id === id
              ? {
                  ...recipe,
                  last_cooked_on: new Date().toISOString(),
                  times_cooked: recipe.times_cooked + 1,
                }
              : recipe
          )
        ),
      // Every id the basket referred to is gone with the old cookbook.
      replaceRecipes: (incoming) =>
        update(() => ({
          basket: emptyBasket(),
          recipes: withUniqueIds(incoming),
        })),
      updateRecipe: (recipe) =>
        mutate((current) =>
          current.map((existing) =>
            existing.id === recipe.id ? recipe : existing
          )
        ),
    };
  }, [loading, recipes, update]);
}

/**
 * Rebuilds a basket around a new set of entries, dropping the ticks of lines
 * that the change has taken off the shopping list.
 */
function prunedBasket(
  recipes: Recipe[],
  entries: BasketEntry[],
  ticked: string[]
) {
  const onTheList = new Set(
    basketIngredients(recipes, entries).map(ingredientKey)
  );
  return { entries, ticked: ticked.filter((key) => onTheList.has(key)) };
}

/** One recipe on the shopping list, with the servings it was added for. */
export type BasketItem = {
  recipe: Recipe;
  servings: number;
};

type BasketValue = {
  /** Every ingredient of the basket's recipes, scaled and merged. */
  ingredients: Ingredient[];
  /** True until the first read from storage has finished. */
  loading: boolean;
  /** The recipes in the basket, in the order they were added. */
  items: BasketItem[];
  /** The `ingredientKey` of every line already ticked off. */
  ticked: Set<string>;
  /** Adds a recipe, or restates one already on the list for new servings. */
  addRecipe: (recipeId: string, servings: number) => void;
  clear: () => void;
  removeRecipe: (recipeId: string) => void;
  /** The servings a recipe is on the list for, or undefined if it is not. */
  servingsFor: (recipeId: string) => number | undefined;
  toggleTicked: (key: string) => void;
};

export function useBasket(): BasketValue {
  const { appData, loading, update } = useStore();
  const { basket, recipes } = appData;

  return useMemo<BasketValue>(() => {
    const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));
    const items = basket.entries
      .map((entry) => {
        const recipe = byId.get(entry.recipeId);
        return recipe ? { recipe, servings: entry.servings } : null;
      })
      .filter((item): item is BasketItem => !!item);

    const setEntries = (next: (current: BasketEntry[]) => BasketEntry[]) =>
      update((current) => ({
        basket: prunedBasket(
          current.recipes,
          next(current.basket.entries),
          current.basket.ticked
        ),
      }));

    return {
      ingredients: basketIngredients(recipes, basket.entries),
      items,
      loading,
      ticked: new Set(basket.ticked),
      addRecipe: (recipeId, servings) =>
        setEntries((current) => {
          const entry = { recipeId, servings: Math.max(1, servings) };
          return current.some((existing) => existing.recipeId === recipeId)
            ? current.map((existing) =>
                existing.recipeId === recipeId ? entry : existing
              )
            : [...current, entry];
        }),
      clear: () => update(() => ({ basket: emptyBasket() })),
      removeRecipe: (recipeId) =>
        setEntries((current) =>
          current.filter((entry) => entry.recipeId !== recipeId)
        ),
      servingsFor: (recipeId) =>
        basket.entries.find((entry) => entry.recipeId === recipeId)?.servings,
      toggleTicked: (key) =>
        update((current) => ({
          basket: {
            ...current.basket,
            ticked: current.basket.ticked.includes(key)
              ? current.basket.ticked.filter((ticked) => ticked !== key)
              : [...current.basket.ticked, key],
          },
        })),
    };
  }, [basket, loading, recipes, update]);
}

type SettingsValue = {
  /** Multiplier for font sizes, from the chosen letter size. */
  fontScale: number;
  settings: AppSettings;
  setAuthorName: (authorName: string) => void;
  setFontSizeLevel: (fontSizeLevel: number) => void;
};

export function useSettings(): SettingsValue {
  const { appData, update } = useStore();
  const { settings } = appData;

  return useMemo<SettingsValue>(() => {
    const patch = (next: Partial<AppSettings>) =>
      update((current) => ({ settings: { ...current.settings, ...next } }));

    return {
      fontScale: FONT_SIZE_LEVELS[settings.fontSizeLevel].scale,
      settings,
      setAuthorName: (authorName) => patch({ authorName }),
      setFontSizeLevel: (fontSizeLevel) => patch({ fontSizeLevel }),
    };
  }, [settings, update]);
}
