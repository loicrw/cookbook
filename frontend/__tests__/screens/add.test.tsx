import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { mockRouter, resetRouterMock } from "@/src/test-utils/router";
import AddRecipeScreen from "@/app/(tabs)/add";
import {
  flushHydration,
  readStorage,
  renderWithProviders,
  seedStorage,
} from "@/src/test-utils";

beforeEach(() => resetRouterMock());

/** Fills in the least a recipe needs, then saves it. */
function writeRecipe(title: string) {
  fireEvent.changeText(
    screen.getByPlaceholderText("Spaghetti carbonara"),
    title
  );
  fireEvent.changeText(screen.getByLabelText("Ingredient"), "flour");
  fireEvent.changeText(screen.getByLabelText("Amount"), "500");
  fireEvent.changeText(screen.getByLabelText("Step 1"), "Bake it");
  fireEvent.press(screen.getByText("Save recipe"));
}

describe("the add recipe screen", () => {
  it("opens a blank form", () => {
    renderWithProviders(<AddRecipeScreen />);

    expect(
      screen.getByPlaceholderText("Spaghetti carbonara").props.value
    ).toBe("");
    expect(screen.getByText("Save recipe")).toBeVisible();
  });

  it("puts the saved recipe in the cookbook", async () => {
    renderWithProviders(<AddRecipeScreen />);
    await flushHydration();

    writeRecipe("Bread");

    await waitFor(async () =>
      expect((await readStorage())?.recipes[0]).toMatchObject({
        ingredients: [{ amount: 500, name: "flour" }],
        title: "Bread",
      })
    );
  });

  it("goes back to the cookbook once the recipe is saved", async () => {
    renderWithProviders(<AddRecipeScreen />);
    await flushHydration();

    writeRecipe("Bread");

    expect(mockRouter.navigate).toHaveBeenCalledWith("/");
  });

  it("leaves a blank form behind for the next visit", async () => {
    renderWithProviders(<AddRecipeScreen />);
    await flushHydration();

    writeRecipe("Bread");

    expect(
      screen.getByPlaceholderText("Spaghetti carbonara").props.value
    ).toBe("");
  });

  it("throws the draft away and leaves on cancel", async () => {
    renderWithProviders(<AddRecipeScreen />);
    await flushHydration();

    fireEvent.changeText(
      screen.getByPlaceholderText("Spaghetti carbonara"),
      "Half an idea"
    );
    fireEvent.press(screen.getByText("Cancel"));

    expect(mockRouter.navigate).toHaveBeenCalledWith("/");
    expect(
      screen.getByPlaceholderText("Spaghetti carbonara").props.value
    ).toBe("");
  });

  it("saves nothing when the form is cancelled", async () => {
    renderWithProviders(<AddRecipeScreen />);
    await flushHydration();

    fireEvent.changeText(
      screen.getByPlaceholderText("Spaghetti carbonara"),
      "Half an idea"
    );
    fireEvent.press(screen.getByText("Cancel"));

    expect((await readStorage())?.recipes ?? []).toEqual([]);
  });

  it("names the cook as the author, from Settings", async () => {
    await seedStorage({ settings: { authorName: "Nonna", fontSizeLevel: 2 } });
    renderWithProviders(<AddRecipeScreen />);

    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Who wrote this recipe?").props.value
      ).toBe("Nonna")
    );
  });

  it("offers what the cookbook already uses while typing", async () => {
    await seedStorage({
      recipes: [
        {
          description: "",
          id: "r1",
          ingredients: [{ amount: 1, name: "semolina", unit: "g" }],
          people_served: 2,
          steps: [{ description: "Mix", order: 1 }],
          tags: ["pasta"],
          times_cooked: 0,
          title: "Pasta",
        },
      ],
    });
    renderWithProviders(<AddRecipeScreen />);

    await waitFor(() => expect(screen.getByText("pasta")).toBeVisible());

    fireEvent(screen.getByLabelText("Ingredient"), "focus");
    expect(screen.getByText("semolina")).toBeVisible();
  });
});
