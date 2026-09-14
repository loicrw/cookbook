import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { RecipeForm } from "../RecipeForm";
import { Recipe } from "../../types/app";
import { makeRecipe, renderWithProviders } from "../../test-utils";

type FormProps = Partial<React.ComponentProps<typeof RecipeForm>>;

function renderForm(props: FormProps = {}) {
  const onCancel = jest.fn();
  const onSave = jest.fn();

  const view = renderWithProviders(
    <RecipeForm
      existingIngredientNames={["flour", "sugar"]}
      existingTags={["baking", "quick"]}
      existingUnits={["g", "ml"]}
      onCancel={onCancel}
      onSave={onSave}
      {...props}
    />
  );

  return { ...view, onCancel, onSave };
}

/** Fills in the least a recipe needs to be saveable. */
function fillMinimum(title = "Bread") {
  fireEvent.changeText(screen.getByPlaceholderText("Spaghetti carbonara"), title);
  fireEvent.changeText(screen.getByLabelText("Ingredient"), "flour");
  fireEvent.changeText(screen.getByLabelText("Amount"), "500");
  fireEvent.changeText(screen.getByLabelText("Step 1"), "Bake it");
}

const save = () => fireEvent.press(screen.getByText("Save"));

describe("RecipeForm", () => {
  describe("a new recipe", () => {
    it("starts blank, with one ingredient row and one step", () => {
      renderForm();

      expect(screen.getByPlaceholderText("Spaghetti carbonara").props.value).toBe(
        ""
      );
      expect(screen.getAllByLabelText("Ingredient")).toHaveLength(1);
      expect(screen.getByLabelText("Step 1")).toBeVisible();
      expect(screen.queryByLabelText("Step 2")).toBeNull();
    });

    it("serves two by default", () => {
      renderForm();

      expect(screen.getByText("people")).toBeVisible();
    });

    it("saves what was filled in", () => {
      const { onSave } = renderForm();

      fillMinimum("Bread");
      fireEvent.changeText(
        screen.getByPlaceholderText("What makes this dish worth cooking?"),
        "A simple loaf"
      );
      fireEvent.changeText(screen.getByLabelText("Unit"), "g");
      save();

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "A simple loaf",
          ingredients: [{ amount: 500, name: "flour", unit: "g" }],
          people_served: 2,
          steps: [{ description: "Bake it", order: 1 }],
          times_cooked: 0,
          title: "Bread",
        })
      );
    });

    it("pre-fills the author from the name in Settings", () => {
      renderForm({ defaultAuthor: "Nonna" });

      expect(
        screen.getByPlaceholderText("Who wrote this recipe?").props.value
      ).toBe("Nonna");
    });

    it("picks up a name set in Settings after the form was first drawn", () => {
      const { rerender } = renderForm({ defaultAuthor: "" });

      rerender(
        <RecipeForm
          defaultAuthor="Nonna"
          existingIngredientNames={[]}
          existingTags={[]}
          existingUnits={[]}
          onCancel={jest.fn()}
          onSave={jest.fn()}
        />
      );

      expect(
        screen.getByPlaceholderText("Who wrote this recipe?").props.value
      ).toBe("Nonna");
    });

    it("leaves an author the user typed alone when Settings changes", () => {
      const { rerender } = renderForm({ defaultAuthor: "" });

      fireEvent.changeText(
        screen.getByPlaceholderText("Who wrote this recipe?"),
        "Me"
      );
      rerender(
        <RecipeForm
          defaultAuthor="Nonna"
          existingIngredientNames={[]}
          existingTags={[]}
          existingUnits={[]}
          onCancel={jest.fn()}
          onSave={jest.fn()}
        />
      );

      expect(
        screen.getByPlaceholderText("Who wrote this recipe?").props.value
      ).toBe("Me");
    });

    it("offers no delete button", () => {
      renderForm();

      expect(screen.queryByText("Delete recipe")).toBeNull();
    });
  });

  describe("an existing recipe", () => {
    const recipe: Recipe = makeRecipe({
      author: "Nonna",
      description: "The Roman classic",
      ingredients: [
        { amount: 200, name: "spaghetti", unit: "g" },
        { amount: "to taste", name: "black pepper" },
      ],
      people_served: 4,
      steps: [
        { description: "Boil the pasta", order: 1 },
        { description: "Toss it through", order: 2 },
      ],
      tags: ["pasta"],
      times_cooked: 3,
      title: "Spaghetti carbonara",
    });

    it("opens with every field filled in", () => {
      renderForm({ initialRecipe: recipe });

      expect(screen.getByDisplayValue("Spaghetti carbonara")).toBeVisible();
      expect(screen.getByDisplayValue("The Roman classic")).toBeVisible();
      expect(screen.getByDisplayValue("Nonna")).toBeVisible();
      expect(screen.getByDisplayValue("4")).toBeVisible();
      expect(screen.getByDisplayValue("Boil the pasta")).toBeVisible();
      expect(screen.getByText("pasta")).toBeVisible();
    });

    it("shows a 'to taste' ingredient with its unit field marked and amount locked", () => {
      renderForm({ initialRecipe: recipe });

      const units = screen.getAllByLabelText("Unit");
      expect(units[1].props.value).toBe("to taste");

      const amounts = screen.getAllByLabelText("Amount");
      expect(amounts[1].props.value).toBe("");
      expect(amounts[1].props.editable).toBe(false);
    });

    it("keeps the id, the author and the cooking history on save", () => {
      const { onSave } = renderForm({ initialRecipe: recipe });

      save();

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          author: "Nonna",
          id: recipe.id,
          times_cooked: 3,
        })
      );
    });

    it("keeps the date it was last cooked on", () => {
      const { onSave } = renderForm({
        initialRecipe: { ...recipe, last_cooked_on: "2026-09-01T00:00:00.000Z" },
      });

      save();

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ last_cooked_on: "2026-09-01T00:00:00.000Z" })
      );
    });

    it("writes a 'to taste' ingredient back as one, with no unit", () => {
      const { onSave } = renderForm({ initialRecipe: recipe });

      save();

      expect(onSave.mock.calls[0][0].ingredients).toContainEqual({
        amount: "to taste",
        name: "black pepper",
        unit: undefined,
      });
    });

    it("offers a delete button when it is given something to do", () => {
      const onDelete = jest.fn();
      renderForm({ initialRecipe: recipe, onDelete });

      fireEvent.press(screen.getByText("Delete recipe"));
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it("takes the label the caller wants on the submit button", () => {
      renderForm({ initialRecipe: recipe, submitLabel: "Save changes" });

      expect(screen.getByText("Save changes")).toBeVisible();
    });

    it("starts a recipe with no ingredients or steps on one blank row each", () => {
      renderForm({
        initialRecipe: makeRecipe({ ingredients: [], steps: [] }),
      });

      expect(screen.getAllByLabelText("Ingredient")).toHaveLength(1);
      expect(screen.getByLabelText("Step 1")).toBeVisible();
    });
  });

  describe("servings", () => {
    it("counts up and down", () => {
      renderForm();

      fireEvent.press(screen.getByRole("button", { name: "More servings" }));
      expect(screen.getByDisplayValue("3")).toBeVisible();

      fireEvent.press(screen.getByRole("button", { name: "Fewer servings" }));
      expect(screen.getByDisplayValue("2")).toBeVisible();
    });

    it("never counts below one person", () => {
      renderForm({ initialRecipe: makeRecipe({ people_served: 1 }) });

      fireEvent.press(screen.getByRole("button", { name: "Fewer servings" }));

      expect(screen.getByDisplayValue("1")).toBeVisible();
      expect(screen.getByText("person")).toBeVisible();
    });

    it("lets a half-typed number stand while it is being typed", () => {
      renderForm();
      const field = screen.getByDisplayValue("2");

      fireEvent.changeText(field, "");

      expect(field.props.value).toBe("");
    });

    it("settles on a sensible number when the field is left", () => {
      renderForm();
      const field = screen.getByDisplayValue("2");

      fireEvent.changeText(field, "abc");
      fireEvent(field, "blur");

      expect(screen.getByDisplayValue("1")).toBeVisible();
    });

    it("rounds a fractional count", () => {
      const { onSave } = renderForm();

      fillMinimum();
      fireEvent.changeText(screen.getByDisplayValue("2"), "3.6");
      save();

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ people_served: 4 })
      );
    });
  });

  describe("ingredients", () => {
    it("adds a row", () => {
      renderForm();

      fireEvent.press(screen.getByText("Add ingredient"));

      expect(screen.getAllByLabelText("Ingredient")).toHaveLength(2);
    });

    it("removes a row", () => {
      renderForm();

      fireEvent.press(screen.getByText("Add ingredient"));
      fireEvent.press(
        screen.getAllByRole("button", { name: "Remove ingredient" })[0]
      );

      expect(screen.getAllByLabelText("Ingredient")).toHaveLength(1);
    });

    it("blanks the last row rather than leaving none", () => {
      renderForm();

      fireEvent.changeText(screen.getByLabelText("Ingredient"), "flour");
      fireEvent.press(
        screen.getByRole("button", { name: "Remove ingredient" })
      );

      expect(screen.getAllByLabelText("Ingredient")).toHaveLength(1);
      expect(screen.getByLabelText("Ingredient").props.value).toBe("");
    });

    it("drops a row the user never named", () => {
      const { onSave } = renderForm();

      fillMinimum();
      fireEvent.press(screen.getByText("Add ingredient"));
      save();

      expect(onSave.mock.calls[0][0].ingredients).toHaveLength(1);
    });

    it("turns a row into 'to taste' when its unit says so", () => {
      const { onSave } = renderForm();

      fillMinimum();
      fireEvent.changeText(screen.getByLabelText("Unit"), "To Taste");
      save();

      expect(onSave.mock.calls[0][0].ingredients[0]).toEqual({
        amount: "to taste",
        name: "flour",
        unit: undefined,
      });
    });

    it("leads the unit suggestions with 'to taste', so it can be found", () => {
      renderForm({ existingUnits: [] });

      fireEvent(screen.getByLabelText("Unit"), "focus");

      expect(screen.getByText("to taste")).toBeVisible();
    });

    it("offers the units already in the cookbook alongside it", () => {
      renderForm();

      fireEvent(screen.getByLabelText("Unit"), "focus");

      expect(screen.getByText("to taste")).toBeVisible();
      expect(screen.getByText("ml")).toBeVisible();
    });

    it("offers the ingredient names already in the cookbook", () => {
      renderForm();

      fireEvent(screen.getByLabelText("Ingredient"), "focus");

      expect(screen.getByText("sugar")).toBeVisible();
    });
  });

  describe("steps", () => {
    it("adds and removes steps", () => {
      renderForm();

      fireEvent.press(screen.getByText("Add step"));
      expect(screen.getByLabelText("Step 2")).toBeVisible();

      fireEvent.press(screen.getByRole("button", { name: "Remove step 2" }));
      expect(screen.queryByLabelText("Step 2")).toBeNull();
    });

    it("blanks the last step rather than leaving none", () => {
      renderForm();

      fireEvent.changeText(screen.getByLabelText("Step 1"), "Bake it");
      fireEvent.press(screen.getByRole("button", { name: "Remove step 1" }));

      expect(screen.getByLabelText("Step 1").props.value).toBe("");
    });

    it("moves a step up and down the list", () => {
      renderForm();

      fireEvent.changeText(screen.getByLabelText("Step 1"), "First");
      fireEvent.press(screen.getByText("Add step"));
      fireEvent.changeText(screen.getByLabelText("Step 2"), "Second");

      fireEvent.press(screen.getByRole("button", { name: "Move step 2 up" }));

      expect(screen.getByLabelText("Step 1").props.value).toBe("Second");
      expect(screen.getByLabelText("Step 2").props.value).toBe("First");

      fireEvent.press(screen.getByRole("button", { name: "Move step 1 down" }));
      expect(screen.getByLabelText("Step 1").props.value).toBe("First");
    });

    it("cannot move the first step up or the last one down", () => {
      renderForm();

      fireEvent.press(screen.getByText("Add step"));

      expect(
        screen.getByRole("button", { name: "Move step 1 up" })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Move step 2 down" })
      ).toBeDisabled();
    });

    it("numbers the saved steps by the order they are shown in", () => {
      const { onSave } = renderForm();

      fillMinimum();
      fireEvent.press(screen.getByText("Add step"));
      fireEvent.changeText(screen.getByLabelText("Step 2"), "Eat it");
      fireEvent.press(screen.getByRole("button", { name: "Move step 2 up" }));
      save();

      expect(onSave.mock.calls[0][0].steps).toEqual([
        { description: "Eat it", order: 1 },
        { description: "Bake it", order: 2 },
      ]);
    });
  });

  describe("what it refuses to save", () => {
    it("a recipe with no title", () => {
      const { onSave } = renderForm();

      fireEvent.changeText(screen.getByLabelText("Ingredient"), "flour");
      fireEvent.changeText(screen.getByLabelText("Amount"), "1");
      fireEvent.changeText(screen.getByLabelText("Step 1"), "Bake it");
      save();

      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByText("A recipe needs a title.")).toBeVisible();
    });

    it("a recipe with no ingredients", () => {
      const { onSave } = renderForm();

      fireEvent.changeText(
        screen.getByPlaceholderText("Spaghetti carbonara"),
        "Bread"
      );
      fireEvent.changeText(screen.getByLabelText("Step 1"), "Bake it");
      save();

      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByText("Add at least one ingredient.")).toBeVisible();
    });

    it("a recipe with no steps", () => {
      const { onSave } = renderForm();

      fireEvent.changeText(
        screen.getByPlaceholderText("Spaghetti carbonara"),
        "Bread"
      );
      fireEvent.changeText(screen.getByLabelText("Ingredient"), "flour");
      fireEvent.changeText(screen.getByLabelText("Amount"), "1");
      save();

      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByText("Add at least one step.")).toBeVisible();
    });

    it("an ingredient with no amount, naming the one at fault", () => {
      const { onSave } = renderForm();

      fireEvent.changeText(
        screen.getByPlaceholderText("Spaghetti carbonara"),
        "Bread"
      );
      fireEvent.changeText(screen.getByLabelText("Ingredient"), " flour ");
      fireEvent.changeText(screen.getByLabelText("Step 1"), "Bake it");
      save();

      expect(onSave).not.toHaveBeenCalled();
      expect(
        screen.getByText(
          'Give "flour" an amount above 0, or mark it as "to taste".'
        )
      ).toBeVisible();
    });

    it("an ingredient whose amount is zero", () => {
      const { onSave } = renderForm();

      fillMinimum();
      fireEvent.changeText(screen.getByLabelText("Amount"), "0");
      save();

      expect(onSave).not.toHaveBeenCalled();
    });

    it("marks the title field itself when the title is what is missing", () => {
      renderForm();

      save();

      expect(
        screen.getByPlaceholderText("Spaghetti carbonara")
      ).toHaveStyle({ borderColor: "#dc2626" });
    });

    it("clears the complaints once they have been dealt with", () => {
      const { onSave } = renderForm();

      save();
      expect(screen.getByText("A recipe needs a title.")).toBeVisible();

      fillMinimum();
      save();

      expect(screen.queryByText("A recipe needs a title.")).toBeNull();
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe("tags", () => {
    it("saves the tags that were chosen", () => {
      const { onSave } = renderForm();

      fillMinimum();
      fireEvent.press(screen.getByText("baking"));
      save();

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ["baking"] })
      );
    });
  });

  it("backs out without saving", () => {
    const { onCancel, onSave } = renderForm();

    fillMinimum();
    fireEvent.press(screen.getByText("Cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});
