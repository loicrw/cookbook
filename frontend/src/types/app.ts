/** Everything the app persists, in the exact shape that is written to storage. */
export type AppData = {
  basket: Basket;
  lastUpdated: number;
  recipes: Recipe[];
  settings: AppSettings;
  version: number;
};

/**
 * The shopping list. No recipe ingredients are stored: they are derived from the
 * cookbook, so editing a recipe updates the list with it. Items added by hand
 * belong to nothing else, so those are stored.
 */
export type Basket = {
  /** The recipes on the list, in the order they were added. */
  entries: BasketEntry[];
  /** Items put on the list by hand, in the order they were added. */
  manualItems: ManualItem[];
  /**
   * The key of every line already ticked off: an `ingredientKey` for a line from
   * a recipe, a `manualItemKey` for one added by hand. Stored so that a reload
   * part-way through a shop does not lose the progress.
   */
  ticked: string[];
};

export type BasketEntry = {
  recipeId: string;
  /** How many servings to shop for. Defaults to the recipe's own count. */
  servings: number;
};

/**
 * One line put on the shopping list by hand. Not necessarily an ingredient, so
 * the amount and the unit are both optional.
 */
export type ManualItem = {
  id: string;
  name: string;
  /** Above 0 when set. Omitted for an item that is not measured. */
  amount?: number;
  unit?: string;
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
