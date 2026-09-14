/** Everything the app persists, in the exact shape that is written to storage. */
export type AppData = {
  basket: Basket;
  lastUpdated: number;
  recipes: Recipe[];
  settings: AppSettings;
  version: number;
};

/**
 * The shopping list. No ingredients are stored: they are derived from the
 * cookbook, so editing a recipe updates the list with it.
 */
export type Basket = {
  /** The recipes on the list, in the order they were added. */
  entries: BasketEntry[];
  /**
   * The `ingredientKey` of every line already ticked off. Stored so that a
   * reload part-way through a shop does not lose the progress.
   */
  ticked: string[];
};

export type BasketEntry = {
  recipeId: string;
  /** How many servings to shop for. Defaults to the recipe's own count. */
  servings: number;
};

export type AppSettings = {
  /** Stamped onto new recipes as the author. Empty means "not set". */
  authorName: string;
  /** Index into FONT_SIZE_LEVELS. */
  fontSizeLevel: number;
};

export type Recipe = {
  description: string;
  id: string;
  ingredients: Ingredient[];
  people_served: number;
  steps: Step[];
  times_cooked: number;
  title: string;
  author?: string;
  /** ISO 8601 date, e.g. "2026-09-13". A Date object would not survive the JSON round-trip. */
  last_cooked_on?: string;
  tags?: string[];
};

export type Ingredient = {
  amount: number | "to taste";
  name: string;
  unit?: string;
};

export type Step = {
  description: string;
  order: number;
};

/** A recipe being edited: same fields, but the id only exists once it has been saved. */
export type RecipeDraft = Omit<Recipe, "id"> & { id?: string };

/** Payload produced by "export recipes" and accepted by "import recipes". */
export type RecipeExport = {
  exportedAt: string;
  recipes: Recipe[];
  version: number;
};
