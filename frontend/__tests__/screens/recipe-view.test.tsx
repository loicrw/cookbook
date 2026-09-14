import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import {
  CURRENT_SCREEN,
  mockRouter,
  registeredScreens,
  resetRouterMock,
  setSearchParams,
} from "@/src/test-utils/router";
import RecipeScreen from "@/app/(tabs)/recipe/[id]/index";
import { AppData } from "@/src/types/app";
import {
  makeRecipe,
  readStorage,
  renderWithProviders,
  seedStorage,
} from "@/src/test-utils";

const carbonara = makeRecipe({
  author: "Nonna",
  description: "The Roman classic",
  id: "carbonara",
  ingredients: [
    { amount: 200, name: "spaghetti", unit: "g" },
    { amount: "to taste", name: "black pepper" },
  ],
  people_served: 2,
  steps: [
    { description: "Boil the pasta", order: 1 },
    { description: "Toss it through", order: 2 },
  ],
  tags: ["pasta", "weeknight"],
  times_cooked: 3,
  title: "Spaghetti carbonara",
});

beforeEach(() => resetRouterMock());

async function renderRecipe(
  id = "carbonara",
  data: Partial<AppData> = { recipes: [carbonara] }
) {
  setSearchParams({ id });
  await seedStorage(data);
  renderWithProviders(<RecipeScreen />);
  await waitFor(() => expect(screen.queryByTestId("loading-screen")).toBeNull());
}

describe("reading a recipe", () => {
  it("waits for storage rather than claiming the recipe is missing", async () => {
    setSearchParams({ id: "carbonara" });
    await seedStorage({ recipes: [carbonara] });
    renderWithProviders(<RecipeScreen />);

    expect(screen.getByTestId("loading-screen")).toBeVisible();
    expect(screen.queryByText("Recipe not found")).toBeNull();

    await waitFor(() =>
      expect(screen.getByText("Spaghetti carbonara")).toBeVisible()
    );
  });

  it("shows the title, the author, the description and the tags", async () => {
    await renderRecipe();

    expect(screen.getByText("Spaghetti carbonara")).toBeVisible();
    expect(screen.getByText("by Nonna")).toBeVisible();
    expect(screen.getByText("The Roman classic")).toBeVisible();
    expect(screen.getByText("pasta")).toBeVisible();
  });

  it("puts the recipe's name in the header", async () => {
    await renderRecipe();

    expect(registeredScreens.get(CURRENT_SCREEN)?.options).toEqual({
      title: "Spaghetti carbonara",
    });
  });

  it("summarises the servings and the cooking history", async () => {
    await renderRecipe();

    expect(screen.getByText(/Serves 2 · cooked 3 times/)).toBeVisible();
  });

  it("says when a recipe has never been cooked", async () => {
    await renderRecipe("new", {
      recipes: [makeRecipe({ id: "new", times_cooked: 0 })],
    });

    expect(screen.getByText(/not cooked yet/)).toBeVisible();
  });

  it("adds the date when there is one", async () => {
    await renderRecipe("dated", {
      recipes: [
        makeRecipe({
          id: "dated",
          last_cooked_on: "2026-09-01T00:00:00.000Z",
          times_cooked: 1,
        }),
      ],
    });

    expect(screen.getByText(/· last on /)).toBeVisible();
  });

  it("lists the ingredients and the numbered steps", async () => {
    await renderRecipe();

    expect(screen.getByText("200 g spaghetti")).toBeVisible();
    expect(screen.getByText("black pepper (to taste)")).toBeVisible();
    expect(screen.getByText("Boil the pasta")).toBeVisible();
    expect(screen.getByText("1.")).toBeVisible();
    expect(screen.getByText("2.")).toBeVisible();
  });

  it("leaves out an author and a description there are none of", async () => {
    await renderRecipe("plain", {
      recipes: [makeRecipe({ description: "", id: "plain" })],
    });

    expect(screen.queryByText(/^by /)).toBeNull();
    expect(screen.queryByText("The Roman classic")).toBeNull();
  });

  it("offers a way back when the recipe is gone", async () => {
    await renderRecipe("deleted", { recipes: [] });

    expect(screen.getByText("Recipe not found")).toBeVisible();

    fireEvent.press(screen.getByText("Back to recipes"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/");
  });
});

describe("cooking a recipe", () => {
  it("ticks ingredients and steps off as you go", async () => {
    await renderRecipe();

    const ingredient = screen.getByRole("checkbox", { name: "200 g spaghetti" });
    fireEvent.press(ingredient);
    expect(
      screen.getByRole("checkbox", { name: "200 g spaghetti" })
    ).toBeChecked();

    fireEvent.press(screen.getByRole("checkbox", { name: "Boil the pasta" }));
    expect(
      screen.getByRole("checkbox", { name: "Boil the pasta" })
    ).toBeChecked();
  });

  it("unticks a line pressed twice", async () => {
    await renderRecipe();

    const line = () => screen.getByRole("checkbox", { name: "200 g spaghetti" });
    fireEvent.press(line());
    fireEvent.press(line());

    expect(line()).not.toBeChecked();
  });

  it("logs the cook and says how many times it has been made", async () => {
    await renderRecipe();

    fireEvent.press(screen.getByText("Done!"));

    await waitFor(() => expect(screen.getByText("Nice one!")).toBeVisible());
    expect(
      screen.getByText('"Spaghetti carbonara" has now been cooked 4 times.')
    ).toBeVisible();

    await waitFor(async () =>
      expect((await readStorage())?.recipes[0].times_cooked).toBe(4)
    );
  });

  it("clears the ticks ready for the next time", async () => {
    await renderRecipe();

    fireEvent.press(screen.getByRole("checkbox", { name: "200 g spaghetti" }));
    fireEvent.press(screen.getByText("Done!"));

    await waitFor(() =>
      expect(
        screen.getByRole("checkbox", { name: "200 g spaghetti" })
      ).not.toBeChecked()
    );
  });
});

describe("putting a recipe on the shopping list", () => {
  it("asks how many servings to shop for, offering the recipe's own", async () => {
    await renderRecipe();

    fireEvent.press(
      screen.getByRole("button", { name: "Add the ingredients to my basket" })
    );

    expect(screen.getByText("Add to your basket")).toBeVisible();
    expect(
      screen.getByText(/The recipe is written for 2 servings/)
    ).toBeVisible();
    expect(screen.getByText("2")).toBeVisible();
  });

  it("adds it for the servings that were chosen", async () => {
    await renderRecipe();

    fireEvent.press(
      screen.getByRole("button", { name: "Add the ingredients to my basket" })
    );
    fireEvent.press(screen.getByRole("button", { name: "More servings" }));
    fireEvent.press(screen.getByText("Add to my basket"));

    await waitFor(async () =>
      expect((await readStorage())?.basket.entries).toEqual([
        { recipeId: "carbonara", servings: 3 },
      ])
    );
  });

  it("adds nothing when the question is cancelled", async () => {
    await renderRecipe();

    fireEvent.press(
      screen.getByRole("button", { name: "Add the ingredients to my basket" })
    );
    fireEvent.press(screen.getByText("Cancel"));

    expect(screen.queryByText("Add to my basket")).toBeNull();
    expect((await readStorage())?.basket.entries).toEqual([]);
  });

  it("offers to restate a recipe already on the list", async () => {
    await renderRecipe("carbonara", {
      basket: {
        entries: [{ recipeId: "carbonara", servings: 6 }],
        manualItems: [],
        ticked: [],
      },
      recipes: [carbonara],
    });

    fireEvent.press(
      screen.getByRole("button", { name: "Add the ingredients to my basket" })
    );

    expect(screen.getByText("Update your basket")).toBeVisible();
    expect(
      screen.getByText(/is on your shopping list for 6 servings/)
    ).toBeVisible();

    fireEvent.press(screen.getByText("Update the basket"));

    await waitFor(async () =>
      expect((await readStorage())?.basket.entries).toEqual([
        { recipeId: "carbonara", servings: 6 },
      ])
    );
  });
});

describe("editing from the recipe", () => {
  it("opens the edit screen for this recipe", async () => {
    await renderRecipe();

    fireEvent.press(screen.getByRole("button", { name: "Edit this recipe" }));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/recipe/[id]/edit",
      params: { id: "carbonara" },
    });
  });
});
