import { DATA_VERSION } from "../../constants/storage";
import {
  DEFAULT_FONT_SIZE_LEVEL,
  FONT_SIZE_LEVELS,
} from "../../constants/settings";
import { Ingredient, Recipe, RecipeDraft } from "../../types/app";
import {
  aggregateIngredients,
  basketIngredients,
  basketKeys,
  collectIngredientNames,
  collectTags,
  collectUnits,
  createId,
  defaultSettings,
  draftToRecipe,
  emptyAppData,
  emptyBasket,
  emptyDraft,
  emptyIngredient,
  emptyStep,
  formatIngredient,
  formatManualItem,
  ingredientKey,
  manualItemKey,
  normalizeAppData,
  normalizeRecipe,
  parseRecipes,
  RecipeParseError,
  scaleIngredients,
  validateDraft,
  withUniqueIds,
} from "../recipes";

const recipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  description: "",
  id: "r1",
  ingredients: [],
  people_served: 2,
  steps: [],
  times_cooked: 0,
  title: "A recipe",
  ...overrides,
});

describe("createId", () => {
  it("uses the platform's UUID generator when there is one", () => {
    const spy = jest
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue("11111111-2222-3333-4444-555555555555");

    expect(createId()).toBe("11111111-2222-3333-4444-555555555555");
    spy.mockRestore();
  });

  it("falls back to a time-and-random id where crypto is missing", () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "crypto");
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: undefined,
    });

    try {
      expect(createId()).toMatch(/^recipe-\d+-[a-z0-9]+$/);
      // Two calls in the same millisecond still have to differ.
      expect(createId()).not.toBe(createId());
    } finally {
      if (original) Object.defineProperty(globalThis, "crypto", original);
    }
  });
});

describe("empty values", () => {
  it("starts a draft with one blank ingredient and one blank step", () => {
    const draft = emptyDraft();

    expect(draft.title).toBe("");
    expect(draft.people_served).toBe(2);
    expect(draft.times_cooked).toBe(0);
    expect(draft.ingredients).toEqual([{ amount: 1, name: "", unit: "" }]);
    expect(draft.steps).toEqual([{ description: "", order: 1 }]);
  });

  it("builds a blank ingredient and a numbered blank step", () => {
    expect(emptyIngredient()).toEqual({ amount: 1, name: "", unit: "" });
    expect(emptyStep(4)).toEqual({ description: "", order: 4 });
  });

  it("builds an empty basket and the default settings", () => {
    expect(emptyBasket()).toEqual({
      entries: [],
      manualItems: [],
      ticked: [],
    });
    expect(defaultSettings()).toEqual({
      authorName: "",
      fontSizeLevel: DEFAULT_FONT_SIZE_LEVEL,
    });
  });

  it("stamps empty app data with the current schema version", () => {
    const data = emptyAppData();

    expect(data.version).toBe(DATA_VERSION);
    expect(data.recipes).toEqual([]);
    expect(data.basket).toEqual(emptyBasket());
    expect(typeof data.lastUpdated).toBe("number");
  });
});

describe("collecting values from the cookbook", () => {
  const cookbook = [
    recipe({
      id: "a",
      ingredients: [
        { amount: 1, name: "Flour", unit: "G" },
        { amount: 2, name: "sugar", unit: "g" },
      ],
      tags: ["Baking", "quick"],
    }),
    recipe({
      id: "b",
      ingredients: [
        // A different spelling of a name already seen keeps the first one.
        { amount: 3, name: "flour", unit: "g" },
        { amount: 1, name: "apple" },
      ],
      tags: ["baking"],
    }),
  ];

  it("de-duplicates tags case-insensitively and sorts them", () => {
    expect(collectTags(cookbook)).toEqual(["Baking", "quick"]);
  });

  it("copes with recipes that carry no tags at all", () => {
    expect(collectTags([recipe()])).toEqual([]);
  });

  it("collects ingredient names, keeping the first spelling seen", () => {
    expect(collectIngredientNames(cookbook)).toEqual([
      "apple",
      "Flour",
      "sugar",
    ]);
  });

  it("collects units, dropping the blank of an ingredient without one", () => {
    expect(collectUnits(cookbook)).toEqual(["G"]);
  });
});

describe("formatIngredient", () => {
  it("writes an amount, a unit and a name in reading order", () => {
    expect(formatIngredient({ amount: 200, name: "flour", unit: "g" })).toBe(
      "200 g flour"
    );
  });

  it("leaves the unit out when there is none", () => {
    expect(formatIngredient({ amount: 3, name: "eggs" })).toBe("3 eggs");
  });

  it("marks a 'to taste' amount after the name instead", () => {
    expect(formatIngredient({ amount: "to taste", name: "salt" })).toBe(
      "salt (to taste)"
    );
  });

  it("ignores a unit that is nothing but whitespace", () => {
    expect(formatIngredient({ amount: 1, name: "lemon", unit: "  " })).toBe(
      "1 lemon"
    );
  });
});

describe("ingredientKey", () => {
  it("ignores case, padding and a missing unit", () => {
    expect(ingredientKey({ amount: 1, name: " Flour ", unit: " G " })).toBe(
      ingredientKey({ amount: 9, name: "flour", unit: "g" })
    );
    expect(ingredientKey({ amount: 1, name: "egg" })).toBe(
      ingredientKey({ amount: 2, name: "egg", unit: "" })
    );
  });

  it("separates a measured amount from a 'to taste' one", () => {
    expect(ingredientKey({ amount: 1, name: "salt" })).not.toBe(
      ingredientKey({ amount: "to taste", name: "salt" })
    );
  });

  it("separates the same name under different units", () => {
    expect(ingredientKey({ amount: 1, name: "milk", unit: "ml" })).not.toBe(
      ingredientKey({ amount: 1, name: "milk", unit: "l" })
    );
  });
});

describe("hand-added lines", () => {
  it("keys a manual item by its id, under a prefix of its own", () => {
    expect(manualItemKey({ id: "abc", name: "bin bags" })).toBe("manual:abc");
  });

  it("never collides with an ingredient key", () => {
    const keys = new Set([
      manualItemKey({ id: "x", name: "flour" }),
      ingredientKey({ amount: 1, name: "flour" }),
    ]);
    expect(keys.size).toBe(2);
  });

  it("formats with whatever of the amount and unit is present", () => {
    expect(
      formatManualItem({ amount: 2, id: "1", name: "potatoes", unit: "kg" })
    ).toBe("2 kg potatoes");
    expect(formatManualItem({ id: "2", name: "bin bags" })).toBe("bin bags");
    expect(formatManualItem({ amount: 6, id: "3", name: "eggs" })).toBe(
      "6 eggs"
    );
    expect(
      formatManualItem({ id: "4", name: "cling film", unit: "  " })
    ).toBe("cling film");
  });
});

describe("scaleIngredients", () => {
  const base = recipe({
    ingredients: [
      { amount: 200, name: "flour", unit: "g" },
      { amount: "to taste", name: "salt" },
    ],
    people_served: 2,
  });

  it("returns the ingredients untouched when nothing changes", () => {
    expect(scaleIngredients(base, 2)).toBe(base.ingredients);
  });

  it("scales measured amounts and leaves 'to taste' alone", () => {
    expect(scaleIngredients(base, 4)).toEqual([
      { amount: 400, name: "flour", unit: "g" },
      { amount: "to taste", name: "salt" },
    ]);
  });

  it("scales down as readily as up", () => {
    expect(scaleIngredients(base, 1)[0].amount).toBe(100);
  });

  it("rounds to two decimals rather than showing float drift", () => {
    const thirds = recipe({
      ingredients: [{ amount: 100, name: "flour", unit: "g" }],
      people_served: 3,
    });

    expect(scaleIngredients(thirds, 1)[0].amount).toBe(33.33);
  });

  it("treats a servings count below one as one", () => {
    expect(scaleIngredients(base, 0)[0].amount).toBe(100);
  });

  it("treats a recipe that serves nobody as serving one", () => {
    const broken = recipe({
      ingredients: [{ amount: 10, name: "flour", unit: "g" }],
      people_served: 0,
    });

    expect(scaleIngredients(broken, 3)[0].amount).toBe(30);
  });
});

describe("aggregateIngredients", () => {
  it("sums the amounts of lines that share a key", () => {
    expect(
      aggregateIngredients([
        [{ amount: 100, name: "flour", unit: "g" }],
        [{ amount: 250, name: "Flour", unit: "G" }],
      ])
    ).toEqual([{ amount: 350, name: "flour", unit: "g" }]);
  });

  it("keeps lines that differ apart, sorted by name", () => {
    expect(
      aggregateIngredients([
        [
          { amount: 1, name: "sugar" },
          { amount: 2, name: "apple" },
        ],
      ])
    ).toEqual([
      { amount: 2, name: "apple" },
      { amount: 1, name: "sugar" },
    ]);
  });

  it("does not add anything to a 'to taste' amount", () => {
    expect(
      aggregateIngredients([
        [{ amount: "to taste", name: "salt" }],
        [{ amount: "to taste", name: "salt" }],
      ])
    ).toEqual([{ amount: "to taste", name: "salt" }]);
  });

  it("rounds a sum that lands on a float remainder", () => {
    expect(
      aggregateIngredients([
        [{ amount: 0.1, name: "oil", unit: "l" }],
        [{ amount: 0.2, name: "oil", unit: "l" }],
      ])[0].amount
    ).toBe(0.3);
  });

  it("does not mutate the ingredients it was given", () => {
    const first: Ingredient[] = [{ amount: 100, name: "flour", unit: "g" }];
    aggregateIngredients([first, [{ amount: 50, name: "flour", unit: "g" }]]);

    expect(first[0].amount).toBe(100);
  });

  it("returns nothing for nothing", () => {
    expect(aggregateIngredients([])).toEqual([]);
  });
});

describe("basketIngredients", () => {
  const bread = recipe({
    id: "bread",
    ingredients: [{ amount: 500, name: "flour", unit: "g" }],
    people_served: 4,
  });
  const cake = recipe({
    id: "cake",
    ingredients: [
      { amount: 100, name: "flour", unit: "g" },
      { amount: 2, name: "eggs" },
    ],
    people_served: 2,
  });

  it("scales each entry to its servings, then merges the lot", () => {
    expect(
      basketIngredients(
        [bread, cake],
        [
          { recipeId: "bread", servings: 2 },
          { recipeId: "cake", servings: 4 },
        ]
      )
    ).toEqual([
      { amount: 4, name: "eggs" },
      { amount: 450, name: "flour", unit: "g" },
    ]);
  });

  it("contributes nothing for an entry whose recipe is gone", () => {
    expect(
      basketIngredients([bread], [{ recipeId: "deleted", servings: 2 }])
    ).toEqual([]);
  });
});

describe("basketKeys", () => {
  it("holds a key for every line, of either kind", () => {
    const bread = recipe({
      id: "bread",
      ingredients: [{ amount: 1, name: "flour", unit: "g" }],
      people_served: 1,
    });

    const keys = basketKeys(
      [bread],
      [{ recipeId: "bread", servings: 1 }],
      [{ id: "m1", name: "bin bags" }]
    );

    expect(keys).toEqual(
      new Set([ingredientKey({ amount: 1, name: "flour", unit: "g" }), "manual:m1"])
    );
  });
});

describe("normalizeRecipe", () => {
  it("rejects anything that is not an object with a title", () => {
    expect(normalizeRecipe(null)).toBeNull();
    expect(normalizeRecipe("a recipe")).toBeNull();
    expect(normalizeRecipe([])).toBeNull();
    expect(normalizeRecipe({})).toBeNull();
    expect(normalizeRecipe({ title: "   " })).toBeNull();
  });

  it("fills in every field a sparse recipe leaves out", () => {
    expect(normalizeRecipe({ title: " Toast " })).toMatchObject({
      description: "",
      ingredients: [],
      people_served: 1,
      steps: [],
      times_cooked: 0,
      title: "Toast",
    });
  });

  it("issues an id when the file has none", () => {
    expect(normalizeRecipe({ title: "Toast", id: "  " })?.id).toBeTruthy();
    expect(normalizeRecipe({ title: "Toast", id: "keep-me" })?.id).toBe(
      "keep-me"
    );
  });

  it("reads numbers written as strings", () => {
    expect(
      normalizeRecipe({
        title: "Toast",
        people_served: "4",
        times_cooked: "7",
      })
    ).toMatchObject({ people_served: 4, times_cooked: 7 });
  });

  it("rounds a fractional serving count and refuses a nonsense one", () => {
    expect(normalizeRecipe({ title: "T", people_served: 2.6 })?.people_served).toBe(3);
    expect(normalizeRecipe({ title: "T", people_served: -1 })?.people_served).toBe(1);
    expect(normalizeRecipe({ title: "T", people_served: "many" })?.people_served).toBe(1);
    // Rounding to 0 is still nobody, so it becomes 1.
    expect(normalizeRecipe({ title: "T", people_served: 0.2 })?.people_served).toBe(1);
  });

  it("drops ingredients with no name and keeps the rest", () => {
    expect(
      normalizeRecipe({
        title: "T",
        ingredients: [
          { name: " flour ", amount: "200", unit: " g " },
          { name: "", amount: 1 },
          { amount: 1 },
          "not an ingredient",
          { name: "salt", amount: "to taste" },
          { name: "pepper", amount: "unmeasurable" },
        ],
      })?.ingredients
    ).toEqual([
      { amount: 200, name: "flour", unit: "g" },
      { amount: "to taste", name: "salt" },
      // An amount that is not a number falls back to "to taste".
      { amount: "to taste", name: "pepper" },
    ]);
  });

  it("ignores an ingredients field that is not a list", () => {
    expect(normalizeRecipe({ title: "T", ingredients: "flour" })?.ingredients).toEqual(
      []
    );
  });

  it("accepts steps written as plain strings", () => {
    expect(
      normalizeRecipe({ title: "T", steps: ["Boil it", "  ", "Eat it"] })?.steps
    ).toEqual([
      { description: "Boil it", order: 1 },
      { description: "Eat it", order: 2 },
    ]);
  });

  it("sorts steps by their stated order, then renumbers from one", () => {
    expect(
      normalizeRecipe({
        title: "T",
        steps: [
          { description: "Second", order: 20 },
          { description: "First", order: 5 },
          { description: "Third", order: 99 },
        ],
      })?.steps
    ).toEqual([
      { description: "First", order: 1 },
      { description: "Second", order: 2 },
      { description: "Third", order: 3 },
    ]);
  });

  it("drops steps with no description and non-objects alike", () => {
    expect(
      normalizeRecipe({
        title: "T",
        steps: [{ description: "  " }, null, 42, { description: "Do it" }],
      })?.steps
    ).toEqual([{ description: "Do it", order: 1 }]);
  });

  it("keeps an author only when there is one", () => {
    expect(normalizeRecipe({ title: "T", author: " Nonna " })?.author).toBe(
      "Nonna"
    );
    expect(normalizeRecipe({ title: "T", author: "  " })).not.toHaveProperty(
      "author"
    );
    expect(normalizeRecipe({ title: "T" })).not.toHaveProperty("author");
  });

  it("trims tags, drops blanks and duplicates, and omits an empty list", () => {
    expect(
      normalizeRecipe({ title: "T", tags: [" quick ", "quick", "", 7, "easy"] })
        ?.tags
    ).toEqual(["quick", "easy"]);
    expect(normalizeRecipe({ title: "T", tags: [] })).not.toHaveProperty("tags");
    expect(normalizeRecipe({ title: "T", tags: "quick" })).not.toHaveProperty(
      "tags"
    );
  });

  it("stores last_cooked_on as an ISO string, whatever it arrived as", () => {
    expect(
      normalizeRecipe({ title: "T", last_cooked_on: "2026-09-01" })
        ?.last_cooked_on
    ).toBe("2026-09-01T00:00:00.000Z");

    expect(
      normalizeRecipe({
        title: "T",
        last_cooked_on: new Date("2026-09-01T10:00:00.000Z"),
      })?.last_cooked_on
    ).toBe("2026-09-01T10:00:00.000Z");
  });

  it("leaves last_cooked_on out when it cannot be read as a date", () => {
    expect(
      normalizeRecipe({ title: "T", last_cooked_on: "never" })
    ).not.toHaveProperty("last_cooked_on");
    expect(normalizeRecipe({ title: "T", last_cooked_on: 12345 })).not.toHaveProperty(
      "last_cooked_on"
    );
  });
});

describe("withUniqueIds", () => {
  it("leaves distinct ids as they are", () => {
    const recipes = [recipe({ id: "a" }), recipe({ id: "b" })];
    expect(withUniqueIds(recipes).map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("re-issues the second of a repeated id, keeping the first", () => {
    const [first, second] = withUniqueIds([
      recipe({ id: "same", title: "One" }),
      recipe({ id: "same", title: "Two" }),
    ]);

    expect(first.id).toBe("same");
    expect(second.id).not.toBe("same");
    expect(second.title).toBe("Two");
  });
});

describe("parseRecipes", () => {
  it("reads a full export payload", () => {
    expect(
      parseRecipes({ version: 6, recipes: [{ title: "Toast" }] })
    ).toHaveLength(1);
  });

  it("reads a bare array of recipes", () => {
    expect(parseRecipes([{ title: "Toast" }])).toHaveLength(1);
  });

  it("skips the unusable entries in an otherwise good file", () => {
    const parsed = parseRecipes([{ title: "Toast" }, { title: "" }, null]);
    expect(parsed).toHaveLength(1);
  });

  it("gives every recipe a distinct id", () => {
    const parsed = parseRecipes([
      { title: "One", id: "dup" },
      { title: "Two", id: "dup" },
    ]);

    expect(new Set(parsed.map((r) => r.id)).size).toBe(2);
  });

  it("rejects a payload that holds no list of recipes", () => {
    expect(() => parseRecipes({ count: 3 })).toThrow(RecipeParseError);
    expect(() => parseRecipes("nonsense")).toThrow(
      /does not look like a cookbook export/
    );
    expect(() => parseRecipes(null)).toThrow(RecipeParseError);
  });

  it("rejects a list in which nothing is usable", () => {
    expect(() => parseRecipes([])).toThrow(/needs at least a title/);
    expect(() => parseRecipes([{ description: "no title" }])).toThrow(
      RecipeParseError
    );
  });
});

describe("normalizeAppData", () => {
  const stored = (overrides: Record<string, unknown>) =>
    normalizeAppData({ version: DATA_VERSION, ...overrides });

  it("degrades anything unrecognisable to an empty cookbook", () => {
    expect(normalizeAppData(null).recipes).toEqual([]);
    expect(normalizeAppData(7).recipes).toEqual([]);
    // Builds before recipes existed stored a counter under this key.
    expect(normalizeAppData({ count: 4 }).recipes).toEqual([]);
  });

  it("always stamps the current schema version", () => {
    expect(normalizeAppData({ version: 1 }).version).toBe(DATA_VERSION);
  });

  it("keeps lastUpdated when it is a number, and invents one otherwise", () => {
    expect(stored({ lastUpdated: 1700000000000 }).lastUpdated).toBe(
      1700000000000
    );
    expect(typeof stored({ lastUpdated: "yesterday" }).lastUpdated).toBe(
      "number"
    );
  });

  it("normalises the recipes and gives them distinct ids", () => {
    const data = stored({
      recipes: [{ title: "One", id: "x" }, { title: "Two", id: "x" }, {}],
    });

    expect(data.recipes).toHaveLength(2);
    expect(new Set(data.recipes.map((r) => r.id)).size).toBe(2);
  });

  describe("the basket", () => {
    const cookbook = [{ title: "Bread", id: "bread", people_served: 4 }];

    it("is empty when there is nothing stored for it", () => {
      expect(stored({ recipes: cookbook }).basket).toEqual(emptyBasket());
      expect(stored({ recipes: cookbook, basket: "gone" }).basket).toEqual(
        emptyBasket()
      );
    });

    it("drops entries whose recipe is no longer in the cookbook", () => {
      expect(
        stored({
          recipes: cookbook,
          basket: {
            entries: [
              { recipeId: "bread", servings: 2 },
              { recipeId: "deleted", servings: 2 },
            ],
          },
        }).basket.entries
      ).toEqual([{ recipeId: "bread", servings: 2 }]);
    });

    it("keeps only the first entry for a recipe listed twice", () => {
      expect(
        stored({
          recipes: cookbook,
          basket: {
            entries: [
              { recipeId: "bread", servings: 2 },
              { recipeId: "bread", servings: 8 },
            ],
          },
        }).basket.entries
      ).toEqual([{ recipeId: "bread", servings: 2 }]);
    });

    it("reads the old recipeIds list as shopping for the recipe as written", () => {
      expect(
        stored({ recipes: cookbook, basket: { recipeIds: ["bread"] } }).basket
          .entries
      ).toEqual([{ recipeId: "bread", servings: 4 }]);
    });

    it("falls back to the recipe's own servings for a missing or silly count", () => {
      expect(
        stored({
          recipes: cookbook,
          basket: { entries: [{ recipeId: "bread" }] },
        }).basket.entries
      ).toEqual([{ recipeId: "bread", servings: 4 }]);

      expect(
        stored({
          recipes: cookbook,
          basket: { entries: [{ recipeId: "bread", servings: 0 }] },
        }).basket.entries
      ).toEqual([{ recipeId: "bread", servings: 1 }]);
    });

    it("reads hand-added lines, dropping the nameless and bad amounts", () => {
      expect(
        stored({
          basket: {
            manualItems: [
              { id: "a", name: " bin bags ", amount: "2", unit: " box " },
              { id: "b", name: "" },
              { id: "c", name: "milk", amount: -1 },
              "not an item",
            ],
          },
        }).basket.manualItems
      ).toEqual([
        { amount: 2, id: "a", name: "bin bags", unit: "box" },
        { id: "c", name: "milk" },
      ]);
    });

    it("re-issues a repeated manual id so the ticks stay distinct", () => {
      const items = stored({
        basket: {
          manualItems: [
            { id: "same", name: "one" },
            { id: "same", name: "two" },
          ],
        },
      }).basket.manualItems;

      expect(items[0].id).toBe("same");
      expect(items[1].id).not.toBe("same");
    });

    it("issues an id to a hand-added line that has none", () => {
      expect(
        stored({ basket: { manualItems: [{ name: "salt" }] } }).basket
          .manualItems[0].id
      ).toBeTruthy();
    });

    it("keeps the ticks of lines still on the list and drops the rest", () => {
      const flourKey = ingredientKey({ amount: 1, name: "flour", unit: "g" });

      expect(
        normalizeAppData({
          version: DATA_VERSION,
          recipes: [
            {
              title: "Bread",
              id: "bread",
              people_served: 1,
              ingredients: [{ name: "flour", amount: 1, unit: "g" }],
            },
          ],
          basket: {
            entries: [{ recipeId: "bread", servings: 1 }],
            manualItems: [{ id: "m1", name: "bin bags" }],
            ticked: [flourKey, "manual:m1", "manual:gone", 7, flourKey],
          },
        }).basket.ticked
      ).toEqual([flourKey, "manual:m1"]);
    });

    it("has no ticks when the stored list is not an array", () => {
      expect(stored({ basket: { ticked: "all" } }).basket.ticked).toEqual([]);
    });
  });

  describe("the settings", () => {
    it("falls back to the defaults when nothing usable is stored", () => {
      expect(stored({}).settings).toEqual(defaultSettings());
      expect(stored({ settings: "large" }).settings).toEqual(defaultSettings());
    });

    it("keeps an author name, trimmed", () => {
      expect(
        stored({ settings: { authorName: "  Nonna  " } }).settings.authorName
      ).toBe("Nonna");
    });

    it("keeps a font size level that is in range", () => {
      expect(
        stored({ settings: { fontSizeLevel: 4 } }).settings.fontSizeLevel
      ).toBe(4);
    });

    it("resets a font size level past the end of the list", () => {
      expect(
        stored({ settings: { fontSizeLevel: FONT_SIZE_LEVELS.length } })
          .settings.fontSizeLevel
      ).toBe(DEFAULT_FONT_SIZE_LEVEL);
    });

    it("moves a level stored before v5 onto the stop that matches it", () => {
      // v4's index 1 was its default, which is index 2 in the current list.
      expect(
        normalizeAppData({ version: 4, settings: { fontSizeLevel: 1 } }).settings
          .fontSizeLevel
      ).toBe(2);
      // v4's largest, index 4, has no larger stop to move to.
      expect(
        normalizeAppData({ version: 4, settings: { fontSizeLevel: 4 } }).settings
          .fontSizeLevel
      ).toBe(4);
    });

    it("leaves a level stored at v5 or later where it is", () => {
      expect(
        normalizeAppData({ version: 5, settings: { fontSizeLevel: 1 } }).settings
          .fontSizeLevel
      ).toBe(1);
    });
  });
});

describe("draftToRecipe", () => {
  const draft = (overrides: Partial<RecipeDraft> = {}): RecipeDraft => ({
    description: "  A bake  ",
    ingredients: [],
    people_served: 2,
    steps: [],
    tags: [],
    times_cooked: 0,
    title: "  Toast  ",
    ...overrides,
  });

  it("trims the text fields", () => {
    expect(draftToRecipe(draft())).toMatchObject({
      description: "A bake",
      title: "Toast",
    });
  });

  it("keeps an existing id and issues one for a new recipe", () => {
    expect(draftToRecipe(draft({ id: "keep" })).id).toBe("keep");
    expect(draftToRecipe(draft()).id).toBeTruthy();
  });

  it("drops nameless ingredients and trims the rest", () => {
    expect(
      draftToRecipe(
        draft({
          ingredients: [
            { amount: 1, name: "  flour  ", unit: "  g  " },
            { amount: 1, name: "   " },
            { amount: 2, name: "eggs", unit: "   " },
          ],
        })
      ).ingredients
    ).toEqual([
      { amount: 1, name: "flour", unit: "g" },
      { amount: 2, name: "eggs", unit: undefined },
    ]);
  });

  it("drops empty steps and renumbers what is left", () => {
    expect(
      draftToRecipe(
        draft({
          steps: [
            { description: "  Second  ", order: 9 },
            { description: "   ", order: 2 },
            { description: "Third", order: 12 },
          ],
        })
      ).steps
    ).toEqual([
      { description: "Second", order: 1 },
      { description: "Third", order: 2 },
    ]);
  });

  it("clamps the counts to something sensible", () => {
    expect(draftToRecipe(draft({ people_served: 0 }))).toMatchObject({
      people_served: 1,
    });
    expect(draftToRecipe(draft({ people_served: 2.4 }))).toMatchObject({
      people_served: 2,
    });
    expect(draftToRecipe(draft({ times_cooked: -3 }))).toMatchObject({
      times_cooked: 0,
    });
    expect(draftToRecipe(draft({ times_cooked: NaN }))).toMatchObject({
      times_cooked: 0,
    });
  });

  it("includes the optional fields only when they hold something", () => {
    expect(draftToRecipe(draft())).not.toHaveProperty("author");
    expect(draftToRecipe(draft())).not.toHaveProperty("tags");
    expect(draftToRecipe(draft())).not.toHaveProperty("last_cooked_on");

    expect(
      draftToRecipe(
        draft({
          author: "  Nonna  ",
          tags: [" quick ", "  "],
          last_cooked_on: "2026-09-01",
        })
      )
    ).toMatchObject({
      author: "Nonna",
      tags: ["quick"],
      last_cooked_on: "2026-09-01",
    });
  });

  it("omits a tag list that trims away to nothing", () => {
    expect(draftToRecipe(draft({ tags: ["  "] }))).not.toHaveProperty("tags");
  });

  it("copes with a draft that carries no tags field", () => {
    const { tags, ...withoutTags } = draft();
    expect(draftToRecipe(withoutTags as RecipeDraft)).not.toHaveProperty("tags");
  });
});

describe("validateDraft", () => {
  const complete: RecipeDraft = {
    description: "",
    ingredients: [{ amount: 1, name: "flour" }],
    people_served: 2,
    steps: [{ description: "Bake it", order: 1 }],
    tags: [],
    times_cooked: 0,
    title: "Bread",
  };

  it("passes a complete draft", () => {
    expect(validateDraft(complete)).toEqual({});
  });

  it("asks for a title", () => {
    expect(validateDraft({ ...complete, title: "   " }).title).toBe(
      "A recipe needs a title."
    );
  });

  it("asks for at least one named ingredient", () => {
    expect(
      validateDraft({ ...complete, ingredients: [{ amount: 1, name: " " }] })
        .ingredients
    ).toBe("Add at least one ingredient.");
  });

  it("asks for at least one described step", () => {
    expect(
      validateDraft({ ...complete, steps: [{ description: " ", order: 1 }] })
        .steps
    ).toBe("Add at least one step.");
  });

  it("reports every problem at once", () => {
    expect(
      validateDraft({
        ...complete,
        title: "",
        ingredients: [],
        steps: [],
      })
    ).toEqual({
      ingredients: "Add at least one ingredient.",
      steps: "Add at least one step.",
      title: "A recipe needs a title.",
    });
  });
});
