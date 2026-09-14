import {
  AppData,
  AppSettings,
  Basket,
  BasketEntry,
  Ingredient,
  ManualItem,
  Recipe,
  RecipeDraft,
  Step,
} from "../types/app";
import { DATA_VERSION } from "../constants/storage";
import {
  DEFAULT_FONT_SIZE_LEVEL,
  FONT_SIZE_LEVELS,
  migrateFontSizeLevel,
} from "../constants/settings";

/**
 * Helpers for creating, validating and normalising recipes.
 *
 * Everything that enters the app from outside (AsyncStorage written by an older
 * build, or a JSON file the user picked) goes through `parseRecipes` first, so
 * the rest of the app can trust that a `Recipe` really has the shape it claims.
 */

export function createId(): string {
  const globalCrypto = globalThis.crypto;
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID();
  }
  return `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyDraft(): RecipeDraft {
  return {
    description: "",
    ingredients: [{ amount: 1, name: "", unit: "" }],
    people_served: 2,
    steps: [{ description: "", order: 1 }],
    tags: [],
    times_cooked: 0,
    title: "",
  };
}

export function emptyIngredient(): Ingredient {
  return { amount: 1, name: "", unit: "" };
}

export function emptyStep(order: number): Step {
  return { description: "", order };
}

export function emptyBasket(): Basket {
  return { entries: [], manualItems: [], ticked: [] };
}

export function defaultSettings(): AppSettings {
  return { authorName: "", fontSizeLevel: DEFAULT_FONT_SIZE_LEVEL };
}

export function emptyAppData(): AppData {
  return {
    basket: emptyBasket(),
    lastUpdated: Date.now(),
    recipes: [],
    settings: defaultSettings(),
    version: DATA_VERSION,
  };
}

/** De-duplicates case-insensitively, keeping the first spelling seen. */
function uniqueSorted(values: string[]): string[] {
  const seen = new Map<string, string>();
  for (const value of values) {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (key && !seen.has(key)) {
      seen.set(key, trimmed);
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

/** Every tag used anywhere in the cookbook, de-duplicated and sorted. */
export function collectTags(recipes: Recipe[]): string[] {
  return uniqueSorted(recipes.flatMap((recipe) => recipe.tags ?? []));
}

/** Every ingredient name used anywhere in the cookbook. */
export function collectIngredientNames(recipes: Recipe[]): string[] {
  return uniqueSorted(
    recipes.flatMap((recipe) =>
      recipe.ingredients.map((ingredient) => ingredient.name)
    )
  );
}

/** Every unit used anywhere in the cookbook. */
export function collectUnits(recipes: Recipe[]): string[] {
  return uniqueSorted(
    recipes.flatMap((recipe) =>
      recipe.ingredients.map((ingredient) => ingredient.unit ?? "")
    )
  );
}

/** Formats an ingredient for display, e.g. "200 g flour" or "salt (to taste)". */
export function formatIngredient(ingredient: Ingredient): string {
  if (ingredient.amount === "to taste") {
    return `${ingredient.name} (to taste)`;
  }
  const unit = ingredient.unit?.trim();
  return [ingredient.amount, unit, ingredient.name].filter(Boolean).join(" ");
}

/**
 * Identifies an ingredient for merging and for React keys: same name, same unit,
 * same kind of amount. "to taste" cannot be added to a measured amount, so it is
 * part of the identity rather than a detail of it.
 */
export function ingredientKey(ingredient: Ingredient): string {
  const unit = ingredient.unit?.trim().toLowerCase() ?? "";
  const toTaste = ingredient.amount === "to taste";
  return `${ingredient.name.trim().toLowerCase()}|${unit}|${toTaste}`;
}

/**
 * Identifies a hand-added line for its tick and its React key. Two items of the
 * same name are two separate lines, so this follows the id rather than the text,
 * and is prefixed so it can never collide with an [[ingredientKey]].
 */
export function manualItemKey(item: ManualItem): string {
  return `manual:${item.id}`;
}

/** Formats a hand-added line for display, e.g. "2 kg potatoes" or "bin bags". */
export function formatManualItem(item: ManualItem): string {
  return [item.amount, item.unit?.trim(), item.name].filter(Boolean).join(" ");
}

/** Two decimals is plenty for a shopping list, and dodges binary float drift. */
function roundAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Restates a recipe's ingredients for a different number of servings. An amount
 * of "to taste" scales with nothing, so it is left as it is.
 */
export function scaleIngredients(
  recipe: Recipe,
  servings: number
): Ingredient[] {
  const factor = Math.max(1, servings) / Math.max(1, recipe.people_served);
  if (factor === 1) return recipe.ingredients;

  return recipe.ingredients.map((ingredient) =>
    typeof ingredient.amount === "number"
      ? { ...ingredient, amount: roundAmount(ingredient.amount * factor) }
      : ingredient
  );
}

/**
 * Merges several ingredient lists into one shopping list. Entries that share an
 * [[ingredientKey]] have their amounts summed; the rest stay separate.
 */
export function aggregateIngredients(groups: Ingredient[][]): Ingredient[] {
  const merged = new Map<string, Ingredient>();

  for (const group of groups) {
    for (const ingredient of group) {
      const key = ingredientKey(ingredient);
      const existing = merged.get(key);

      if (!existing) {
        merged.set(key, { ...ingredient });
      } else if (
        typeof existing.amount === "number" &&
        typeof ingredient.amount === "number"
      ) {
        existing.amount = roundAmount(existing.amount + ingredient.amount);
      }
    }
  }

  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The shopping list for a basket: every entry scaled to its servings, then
 * merged. Entries whose recipe has since been deleted contribute nothing.
 */
export function basketIngredients(
  recipes: Recipe[],
  entries: BasketEntry[]
): Ingredient[] {
  const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));

  return aggregateIngredients(
    entries.map((entry) => {
      const recipe = byId.get(entry.recipeId);
      return recipe ? scaleIngredients(recipe, entry.servings) : [];
    })
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asPositiveInt(value: unknown, fallback: number): number {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.round(parsed);
}

function normalizeIngredient(raw: unknown): Ingredient | null {
  if (!isRecord(raw)) return null;

  const name = asString(raw.name).trim();
  if (!name) return null;

  let amount: number | "to taste" = "to taste";
  if (raw.amount !== "to taste") {
    const parsed =
      typeof raw.amount === "string" ? Number(raw.amount) : raw.amount;
    if (typeof parsed === "number" && Number.isFinite(parsed)) {
      amount = parsed;
    }
  }

  const unit = asString(raw.unit).trim();
  return unit ? { amount, name, unit } : { amount, name };
}

function normalizeStep(raw: unknown, index: number): Step | null {
  // Tolerate files that store steps as plain strings.
  if (typeof raw === "string") {
    const description = raw.trim();
    return description ? { description, order: index + 1 } : null;
  }
  if (!isRecord(raw)) return null;

  const description = asString(raw.description).trim();
  if (!description) return null;

  return { description, order: asPositiveInt(raw.order, index + 1) };
}

function normalizeTags(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const tags = raw
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.length ? [...new Set(tags)] : undefined;
}

function normalizeLastCookedOn(raw: unknown): string | undefined {
  if (typeof raw !== "string" && !(raw instanceof Date)) return undefined;
  const date = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * Turns one untrusted object into a Recipe, or returns null if it is too broken
 * to be useful. A recipe needs at least a title to be worth keeping.
 */
export function normalizeRecipe(raw: unknown): Recipe | null {
  if (!isRecord(raw)) return null;

  const title = asString(raw.title).trim();
  if (!title) return null;

  const ingredients = Array.isArray(raw.ingredients)
    ? raw.ingredients.map(normalizeIngredient).filter((i): i is Ingredient => !!i)
    : [];

  const steps = Array.isArray(raw.steps)
    ? raw.steps
        .map(normalizeStep)
        .filter((s): s is Step => !!s)
        .sort((a, b) => a.order - b.order)
        .map((step, index) => ({ ...step, order: index + 1 }))
    : [];

  const recipe: Recipe = {
    description: asString(raw.description).trim(),
    id: asString(raw.id).trim() || createId(),
    ingredients,
    people_served: asPositiveInt(raw.people_served, 1) || 1,
    steps,
    times_cooked: asPositiveInt(raw.times_cooked, 0),
    title,
  };

  const author = asString(raw.author).trim();
  if (author) recipe.author = author;

  const tags = normalizeTags(raw.tags);
  if (tags) recipe.tags = tags;

  const lastCookedOn = normalizeLastCookedOn(raw.last_cooked_on);
  if (lastCookedOn) recipe.last_cooked_on = lastCookedOn;

  return recipe;
}

/** Ensures no two recipes in the collection share an id. */
export function withUniqueIds(recipes: Recipe[]): Recipe[] {
  const used = new Set<string>();
  return recipes.map((recipe) => {
    if (!used.has(recipe.id)) {
      used.add(recipe.id);
      return recipe;
    }
    const id = createId();
    used.add(id);
    return { ...recipe, id };
  });
}

export class RecipeParseError extends Error {}

/**
 * Reads a recipe collection out of an arbitrary parsed JSON value.
 *
 * Accepts either a full app/export payload (`{ recipes: [...] }`) or a bare
 * array of recipes, and throws a user-presentable RecipeParseError otherwise.
 */
export function parseRecipes(raw: unknown): Recipe[] {
  const list = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.recipes)
      ? raw.recipes
      : null;

  if (!list) {
    throw new RecipeParseError(
      "That file does not look like a cookbook export. Expected a list of recipes."
    );
  }

  const recipes = list.map(normalizeRecipe).filter((r): r is Recipe => !!r);
  if (!recipes.length) {
    throw new RecipeParseError(
      "No usable recipes were found in that file. Every recipe needs at least a title."
    );
  }

  return withUniqueIds(recipes);
}

/**
 * Reads one basket entry. Data from before servings were stored holds bare
 * recipe ids, which mean "shop for the recipe as written".
 */
function normalizeBasketEntry(
  raw: unknown,
  known: Map<string, Recipe>
): BasketEntry | null {
  const recipeId =
    typeof raw === "string"
      ? raw
      : isRecord(raw)
        ? asString(raw.recipeId).trim()
        : "";

  const recipe = known.get(recipeId);
  if (!recipe) return null;

  const servings = isRecord(raw)
    ? asPositiveInt(raw.servings, recipe.people_served)
    : recipe.people_served;

  return { recipeId, servings: Math.max(1, servings) };
}

/** Reads one hand-added line, or returns null if it has no name to show. */
function normalizeManualItem(raw: unknown): ManualItem | null {
  if (!isRecord(raw)) return null;

  const name = asString(raw.name).trim();
  if (!name) return null;

  const item: ManualItem = { id: asString(raw.id).trim() || createId(), name };

  const parsed = typeof raw.amount === "string" ? Number(raw.amount) : raw.amount;
  if (typeof parsed === "number" && Number.isFinite(parsed) && parsed > 0) {
    item.amount = parsed;
  }

  const unit = asString(raw.unit).trim();
  if (unit) item.unit = unit;

  return item;
}

/**
 * Drops basket entries that no longer point at a recipe in the cookbook, and
 * ticks whose line is no longer on the list.
 */
function normalizeBasket(raw: unknown, recipes: Recipe[]): Basket {
  if (!isRecord(raw)) return emptyBasket();

  const known = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  // The list used to live in `recipeIds`, without servings.
  const rawEntries = Array.isArray(raw.entries)
    ? raw.entries
    : Array.isArray(raw.recipeIds)
      ? raw.recipeIds
      : [];

  const entries: BasketEntry[] = [];
  const seen = new Set<string>();

  for (const item of rawEntries) {
    const entry = normalizeBasketEntry(item, known);
    if (entry && !seen.has(entry.recipeId)) {
      seen.add(entry.recipeId);
      entries.push(entry);
    }
  }

  const manualItems = Array.isArray(raw.manualItems)
    ? withUniqueManualIds(
        raw.manualItems
          .map(normalizeManualItem)
          .filter((item): item is ManualItem => !!item)
      )
    : [];

  const onTheList = basketKeys(recipes, entries, manualItems);
  const ticked = Array.isArray(raw.ticked)
    ? raw.ticked.filter(
        (key): key is string => typeof key === "string" && onTheList.has(key)
      )
    : [];

  return { entries, manualItems, ticked: [...new Set(ticked)] };
}

/** Ensures no two hand-added lines share an id, so their ticks stay distinct. */
function withUniqueManualIds(items: ManualItem[]): ManualItem[] {
  const used = new Set<string>();
  return items.map((item) => {
    if (!used.has(item.id)) {
      used.add(item.id);
      return item;
    }
    const id = createId();
    used.add(id);
    return { ...item, id };
  });
}

/** Every tick key a basket can legitimately hold, recipe lines and manual both. */
export function basketKeys(
  recipes: Recipe[],
  entries: BasketEntry[],
  manualItems: ManualItem[]
): Set<string> {
  return new Set([
    ...basketIngredients(recipes, entries).map(ingredientKey),
    ...manualItems.map(manualItemKey),
  ]);
}

function normalizeSettings(raw: unknown, storedVersion: number): AppSettings {
  if (!isRecord(raw)) return defaultSettings();

  const stored = asPositiveInt(raw.fontSizeLevel, DEFAULT_FONT_SIZE_LEVEL);
  // The list of sizes gained a stop below "Default" in v5, so older levels
  // point at the wrong entry until they are moved along.
  const level = storedVersion < 5 ? migrateFontSizeLevel(stored) : stored;

  return {
    authorName: asString(raw.authorName).trim(),
    fontSizeLevel:
      level < FONT_SIZE_LEVELS.length ? level : DEFAULT_FONT_SIZE_LEVEL,
  };
}

/**
 * Normalises whatever was in storage. Older builds stored a counter rather than
 * recipes, so an unrecognised payload degrades to an empty cookbook instead of
 * throwing.
 */
export function normalizeAppData(raw: unknown): AppData {
  if (!isRecord(raw)) return emptyAppData();

  const recipes = Array.isArray(raw.recipes)
    ? withUniqueIds(
        raw.recipes.map(normalizeRecipe).filter((r): r is Recipe => !!r)
      )
    : [];

  return {
    basket: normalizeBasket(raw.basket, recipes),
    lastUpdated: asPositiveInt(raw.lastUpdated, Date.now()),
    recipes,
    settings: normalizeSettings(raw.settings, asPositiveInt(raw.version, 0)),
    version: DATA_VERSION,
  };
}

/** Turns a form draft into a saveable recipe: trims text and renumbers steps. */
export function draftToRecipe(draft: RecipeDraft): Recipe {
  const ingredients = draft.ingredients
    .map((ingredient) => ({
      ...ingredient,
      name: ingredient.name.trim(),
      unit: ingredient.unit?.trim() || undefined,
    }))
    .filter((ingredient) => ingredient.name.length > 0);

  const steps = draft.steps
    .map((step) => ({ ...step, description: step.description.trim() }))
    .filter((step) => step.description.length > 0)
    .map((step, index) => ({ ...step, order: index + 1 }));

  const tags = (draft.tags ?? []).map((tag) => tag.trim()).filter(Boolean);
  const author = draft.author?.trim();

  return {
    description: draft.description.trim(),
    id: draft.id ?? createId(),
    ingredients,
    people_served: Math.max(1, Math.round(draft.people_served) || 1),
    steps,
    times_cooked: Math.max(0, Math.round(draft.times_cooked) || 0),
    title: draft.title.trim(),
    ...(author ? { author } : {}),
    ...(tags.length ? { tags } : {}),
    ...(draft.last_cooked_on ? { last_cooked_on: draft.last_cooked_on } : {}),
  };
}

export type DraftErrors = {
  ingredients?: string;
  steps?: string;
  title?: string;
};

export function validateDraft(draft: RecipeDraft): DraftErrors {
  const errors: DraftErrors = {};

  if (!draft.title.trim()) {
    errors.title = "A recipe needs a title.";
  }
  if (!draft.ingredients.some((ingredient) => ingredient.name.trim())) {
    errors.ingredients = "Add at least one ingredient.";
  }
  if (!draft.steps.some((step) => step.description.trim())) {
    errors.steps = "Add at least one step.";
  }

  return errors;
}
