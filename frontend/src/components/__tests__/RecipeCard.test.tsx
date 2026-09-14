import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { RecipeCard } from "../RecipeCard";
import { makeRecipe, renderWithProviders } from "../../test-utils";

describe("RecipeCard", () => {
  const recipe = makeRecipe({
    description: "The Roman classic",
    ingredients: [
      { amount: 200, name: "spaghetti", unit: "g" },
      { amount: 3, name: "egg yolks" },
    ],
    people_served: 2,
    steps: [
      { description: "Boil", order: 1 },
      { description: "Toss", order: 2 },
    ],
    tags: ["pasta", "weeknight"],
    title: "Spaghetti carbonara",
  });

  it("shows the title, the description and the tags", () => {
    renderWithProviders(<RecipeCard onPress={jest.fn()} recipe={recipe} />);

    expect(screen.getByText("Spaghetti carbonara")).toBeVisible();
    expect(screen.getByText("The Roman classic")).toBeVisible();
    expect(screen.getByText("pasta")).toBeVisible();
    expect(screen.getByText("weeknight")).toBeVisible();
  });

  it("summarises what the recipe asks of the cook", () => {
    renderWithProviders(<RecipeCard onPress={jest.fn()} recipe={recipe} />);

    expect(
      screen.getByText("Serves 2 · 2 ingredients · 2 steps")
    ).toBeVisible();
  });

  it("counts one of each in the singular", () => {
    renderWithProviders(
      <RecipeCard
        onPress={jest.fn()}
        recipe={makeRecipe({
          ingredients: [{ amount: 1, name: "bread" }],
          people_served: 1,
          steps: [{ description: "Toast it", order: 1 }],
        })}
      />
    );

    expect(screen.getByText("Serves 1 · 1 ingredient · 1 step")).toBeVisible();
  });

  it("leaves out a description there is none of", () => {
    renderWithProviders(
      <RecipeCard
        onPress={jest.fn()}
        recipe={makeRecipe({ description: "", title: "Toast" })}
      />
    );

    expect(screen.queryByText("The Roman classic")).toBeNull();
    expect(screen.getByText("Toast")).toBeVisible();
  });

  it("shows no tag row for a recipe with no tags", () => {
    renderWithProviders(
      <RecipeCard onPress={jest.fn()} recipe={makeRecipe({ tags: [] })} />
    );

    expect(screen.queryByText("pasta")).toBeNull();
  });

  it("opens the recipe it names when pressed", () => {
    const onPress = jest.fn();
    renderWithProviders(<RecipeCard onPress={onPress} recipe={recipe} />);

    fireEvent.press(
      screen.getByRole("button", { name: "Open Spaghetti carbonara" })
    );
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("keeps a long title and description to a few lines", () => {
    renderWithProviders(<RecipeCard onPress={jest.fn()} recipe={recipe} />);

    expect(screen.getByText("Spaghetti carbonara").props.numberOfLines).toBe(2);
    expect(screen.getByText("The Roman classic").props.numberOfLines).toBe(3);
  });
});
