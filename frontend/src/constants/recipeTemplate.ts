import { DATA_VERSION } from "./storage";

/**
 * The format description handed out by "Export recipe template" in Settings.
 *
 * It is written for an LLM rather than for the app: the importer already accepts
 * this shape, so the template's job is to spell out every field, its type and
 * whether it is optional, and to show one filled-in example to copy.
 *
 * Keep it in step with `normalizeRecipe` in `src/utils/recipes.ts`, which is what
 * actually reads an imported file.
 */
export const RECIPE_TEMPLATE = {
  purpose:
    "Describes the JSON a Cookbook import file must contain. Produce a file in the shape of `example` below, then import it through Settings > Data > Import recipes.",
  instructions: [
    "Return one JSON object with a `recipes` array. A bare array of recipes is also accepted.",
    "Every recipe needs a title. A recipe without one is dropped on import.",
    "Omit optional fields entirely rather than sending null or an empty string.",
    "Amounts are per the number of people in `people_served`. The app rescales them when the recipe goes on a shopping list.",
    "Use \"to taste\" as the amount for anything measured by eye, such as salt, and leave its unit out.",
    "Do not invent an `id`: the app assigns one on import.",
  ],
  fileFormat: {
    version: `number, optional. The data format this file was written for. Current version: ${DATA_VERSION}.`,
    exportedAt: "string, optional. ISO 8601 timestamp, e.g. \"2026-09-14T10:30:00.000Z\".",
    recipes: "array of recipe objects, required. See `recipeFields`.",
  },
  recipeFields: {
    title: "string, required. The name of the dish.",
    description:
      "string, required. One or two sentences on what the dish is. Use \"\" if there is nothing to say.",
    people_served:
      "integer, required. How many people the amounts below feed. Must be 1 or more.",
    ingredients:
      "array, required. One object per ingredient. See `ingredientFields`. May be empty, but a recipe is of little use without it.",
    steps:
      "array, required. One object per step, in the order they are carried out. See `stepFields`.",
    times_cooked:
      "integer, required. How many times this recipe has been cooked. Use 0 for a new recipe.",
    author: "string, optional. Who wrote the recipe.",
    tags:
      "array of strings, optional. Short labels such as \"vegetarian\" or \"weeknight\". Duplicates are removed.",
    last_cooked_on:
      "string, optional. ISO 8601 date or timestamp, e.g. \"2026-09-13\". Leave out if the recipe has never been cooked.",
  },
  ingredientFields: {
    name: "string, required. The ingredient itself, without the amount, e.g. \"plain flour\".",
    amount:
      "number, or the string \"to taste\", required. A number must be above 0. Fractions are written as decimals, e.g. 0.5.",
    unit:
      "string, optional. The unit the amount is measured in, e.g. \"g\", \"ml\", \"tbsp\". Leave out for countable things and for \"to taste\" amounts.",
  },
  stepFields: {
    description: "string, required. What to do in this step.",
    order: "integer, required. 1 for the first step, counting up. Renumbered on import.",
  },
  example: {
    version: DATA_VERSION,
    exportedAt: "2026-09-14T10:30:00.000Z",
    recipes: [
      {
        title: "Spaghetti carbonara",
        description:
          "The Roman classic: eggs, cheese and cured pork, with no cream anywhere near it.",
        people_served: 2,
        author: "Nonna",
        tags: ["pasta", "weeknight"],
        times_cooked: 3,
        last_cooked_on: "2026-09-01",
        ingredients: [
          { name: "spaghetti", amount: 200, unit: "g" },
          { name: "guanciale", amount: 100, unit: "g" },
          { name: "egg yolks", amount: 3 },
          { name: "pecorino romano", amount: 50, unit: "g" },
          { name: "black pepper", amount: "to taste" },
        ],
        steps: [
          {
            order: 1,
            description:
              "Boil the spaghetti in well salted water until just short of al dente.",
          },
          {
            order: 2,
            description:
              "Crisp the guanciale in a dry pan over a medium heat, then take the pan off the hob.",
          },
          {
            order: 3,
            description: "Beat the yolks with the pecorino and plenty of pepper.",
          },
          {
            order: 4,
            description:
              "Toss the drained pasta through the guanciale, then stir in the egg mixture with a splash of pasta water off the heat until glossy.",
          },
        ],
      },
    ],
  },
} as const;

export const RECIPE_TEMPLATE_FILE_NAME = "cookbook-recipe-template.json";
