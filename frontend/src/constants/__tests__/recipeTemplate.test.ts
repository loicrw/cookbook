import { DATA_VERSION } from "../storage";
import {
  RECIPE_TEMPLATE,
  RECIPE_TEMPLATE_FILE_NAME,
} from "../recipeTemplate";
import { parseRecipes } from "../../utils/recipes";

describe("RECIPE_TEMPLATE", () => {
  it("quotes the app's own data version, so it cannot drift", () => {
    expect(RECIPE_TEMPLATE.example.version).toBe(DATA_VERSION);
    expect(RECIPE_TEMPLATE.fileFormat.version).toContain(String(DATA_VERSION));
  });

  it("describes every field the importer reads", () => {
    expect(Object.keys(RECIPE_TEMPLATE.recipeFields)).toEqual(
      expect.arrayContaining([
        "title",
        "description",
        "people_served",
        "ingredients",
        "steps",
        "times_cooked",
        "author",
        "tags",
        "last_cooked_on",
      ])
    );
    expect(Object.keys(RECIPE_TEMPLATE.ingredientFields)).toEqual(
      expect.arrayContaining(["name", "amount", "unit"])
    );
    expect(Object.keys(RECIPE_TEMPLATE.stepFields)).toEqual(
      expect.arrayContaining(["description", "order"])
    );
  });

  it("survives the JSON round trip the export puts it through", () => {
    expect(JSON.parse(JSON.stringify(RECIPE_TEMPLATE))).toEqual(
      JSON.parse(JSON.stringify(RECIPE_TEMPLATE))
    );
  });

  it("names the file it is written to", () => {
    expect(RECIPE_TEMPLATE_FILE_NAME).toMatch(/\.json$/);
  });

  /**
   * The template's whole job is to describe a file the app will accept, so the
   * example it hands out has to import cleanly. This is what stops the two
   * drifting apart.
   */
  describe("its worked example", () => {
    const [imported] = parseRecipes(
      JSON.parse(JSON.stringify(RECIPE_TEMPLATE.example))
    );

    it("imports as one usable recipe", () => {
      expect(imported.title).toBe("Spaghetti carbonara");
      expect(imported.people_served).toBe(2);
      expect(imported.times_cooked).toBe(3);
    });

    it("keeps its optional fields", () => {
      expect(imported.author).toBe("Nonna");
      expect(imported.tags).toEqual(["pasta", "weeknight"]);
      expect(imported.last_cooked_on).toBe("2026-09-01T00:00:00.000Z");
    });

    it("keeps every ingredient, the 'to taste' one included", () => {
      expect(imported.ingredients).toHaveLength(
        RECIPE_TEMPLATE.example.recipes[0].ingredients.length
      );
      expect(imported.ingredients).toContainEqual({
        amount: "to taste",
        name: "black pepper",
      });
    });

    it("keeps every step, numbered from one", () => {
      expect(imported.steps.map((step) => step.order)).toEqual([1, 2, 3, 4]);
    });

    it("is given an id by the app rather than carrying one", () => {
      expect(imported.id).toBeTruthy();
      expect(RECIPE_TEMPLATE.example.recipes[0]).not.toHaveProperty("id");
    });
  });
});
