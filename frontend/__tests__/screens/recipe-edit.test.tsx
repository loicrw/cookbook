import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import {
  CURRENT_SCREEN,
  mockRouter,
  registeredScreens,
  resetRouterMock,
  setSearchParams,
} from "@/src/test-utils/router";
import EditRecipeScreen from "@/app/(tabs)/recipe/[id]/edit";
import { AppData } from "@/src/types/app";
import {
  makeRecipe,
  readStorage,
  renderWithProviders,
  seedStorage,
} from "@/src/test-utils";

const bread = makeRecipe({
  id: "bread",
  ingredients: [{ amount: 500, name: "flour", unit: "g" }],
  steps: [{ description: "Bake it", order: 1 }],
  times_cooked: 2,
  title: "Bread",
});

beforeEach(() => resetRouterMock());

async function renderEdit(
  id = "bread",
  data: Partial<AppData> = { recipes: [bread] }
) {
  setSearchParams({ id });
  await seedStorage(data);
  renderWithProviders(<EditRecipeScreen />);
  await waitFor(() => expect(screen.queryByTestId("loading-screen")).toBeNull());
}

describe("editing a recipe", () => {
  it("waits for storage rather than claiming the recipe is missing", async () => {
    setSearchParams({ id: "bread" });
    await seedStorage({ recipes: [bread] });
    renderWithProviders(<EditRecipeScreen />);

    expect(screen.getByTestId("loading-screen")).toBeVisible();
    expect(screen.queryByText("Recipe not found")).toBeNull();

    await waitFor(() =>
      expect(screen.getByDisplayValue("Bread")).toBeVisible()
    );
  });

  it("opens the recipe in the form", async () => {
    await renderEdit();

    expect(screen.getByDisplayValue("Bread")).toBeVisible();
    expect(screen.getByDisplayValue("flour")).toBeVisible();
    expect(screen.getByDisplayValue("Bake it")).toBeVisible();
    expect(screen.getByText("Save changes")).toBeVisible();
  });

  it("names the recipe in the header", async () => {
    await renderEdit();

    expect(registeredScreens.get(CURRENT_SCREEN)?.options).toEqual({
      title: "Edit Bread",
    });
  });

  it("saves the changes and goes back to the recipe", async () => {
    await renderEdit();

    fireEvent.changeText(screen.getByDisplayValue("Bread"), "Sourdough");
    fireEvent.press(screen.getByText("Save changes"));

    await waitFor(async () =>
      expect((await readStorage())?.recipes[0].title).toBe("Sourdough")
    );
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it("keeps the cooking history through an edit", async () => {
    await renderEdit();

    fireEvent.changeText(screen.getByDisplayValue("Bread"), "Sourdough");
    fireEvent.press(screen.getByText("Save changes"));

    await waitFor(async () =>
      expect((await readStorage())?.recipes[0].times_cooked).toBe(2)
    );
  });

  it("opens the recipe directly when there is nothing to go back to", async () => {
    mockRouter.canGoBack.mockReturnValue(false);
    await renderEdit();

    fireEvent.press(screen.getByText("Cancel"));

    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: "/recipe/[id]",
      params: { id: "bread" },
    });
  });

  it("changes nothing when the edit is cancelled", async () => {
    await renderEdit();

    fireEvent.changeText(screen.getByDisplayValue("Bread"), "Sourdough");
    fireEvent.press(screen.getByText("Cancel"));

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect((await readStorage())?.recipes[0].title).toBe("Bread");
  });

  it("offers a way back when the recipe is gone", async () => {
    await renderEdit("deleted", { recipes: [] });

    expect(screen.getByText("Recipe not found")).toBeVisible();

    fireEvent.press(screen.getByText("Back to recipes"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/");
  });
});

describe("deleting a recipe", () => {
  it("asks first, and warns that the copy is the only one", async () => {
    await renderEdit();

    fireEvent.press(screen.getByText("Delete recipe"));

    expect(screen.getByText("Delete this recipe?")).toBeVisible();
    expect(
      screen.getByText(
        '"Bread" will be removed from this device. Export your cookbook first if you want a copy.'
      )
    ).toBeVisible();
  });

  it("keeps the recipe when the question is declined", async () => {
    await renderEdit();

    fireEvent.press(screen.getByText("Delete recipe"));
    fireEvent.press(screen.getByText("Keep recipe"));

    expect(screen.queryByText("Delete this recipe?")).toBeNull();
    expect((await readStorage())?.recipes).toHaveLength(1);
  });

  it("deletes it and returns to the cookbook, not to the recipe", async () => {
    await renderEdit();

    fireEvent.press(screen.getByText("Delete recipe"));
    fireEvent.press(screen.getByText("Delete"));

    await waitFor(async () =>
      expect((await readStorage())?.recipes).toEqual([])
    );
    // Going back would land on a recipe that no longer exists.
    expect(mockRouter.replace).toHaveBeenCalledWith("/");
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it("takes the recipe off the shopping list with it", async () => {
    await renderEdit("bread", {
      basket: {
        entries: [{ recipeId: "bread", servings: 2 }],
        manualItems: [],
        ticked: [],
      },
      recipes: [bread],
    });

    fireEvent.press(screen.getByText("Delete recipe"));
    fireEvent.press(screen.getByText("Delete"));

    await waitFor(async () =>
      expect((await readStorage())?.basket.entries).toEqual([])
    );
  });
});
