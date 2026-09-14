import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { mockRouter, resetRouterMock } from "@/src/test-utils/router";
import RecipesScreen from "@/app/(tabs)/index";
import {
  makeRecipe,
  renderWithProviders,
  seedStorage,
} from "@/src/test-utils";

const bread = makeRecipe({ id: "bread", title: "Bread" });
const cake = makeRecipe({ id: "cake", title: "Cake" });

beforeEach(() => resetRouterMock());

describe("the recipes screen", () => {
  it("waits for storage rather than flashing an empty cookbook", async () => {
    await seedStorage({ recipes: [bread] });
    renderWithProviders(<RecipesScreen />);

    expect(screen.getByTestId("loading-screen")).toBeVisible();
    expect(screen.queryByText("No recipes yet")).toBeNull();

    await waitFor(() => expect(screen.getByText("Bread")).toBeVisible());
  });

  it("points a new user at both ways of getting started", async () => {
    renderWithProviders(<RecipesScreen />);

    await waitFor(() => expect(screen.getByText("No recipes yet")).toBeVisible());
    expect(
      screen.getByText(/Tap "Add recipe" in the bottom bar/)
    ).toBeVisible();
  });

  it("shows a card per recipe, in the order the cookbook holds them", async () => {
    await seedStorage({ recipes: [cake, bread] });
    renderWithProviders(<RecipesScreen />);

    await waitFor(() => expect(screen.getByText("Cake")).toBeVisible());
    expect(
      screen.getAllByRole("button", { name: /^Open / }).map((card) =>
        card.props.accessibilityLabel
      )
    ).toEqual(["Open Cake", "Open Bread"]);
  });

  it("opens the recipe whose card was tapped", async () => {
    await seedStorage({ recipes: [bread, cake] });
    renderWithProviders(<RecipesScreen />);

    await waitFor(() => expect(screen.getByText("Cake")).toBeVisible());
    fireEvent.press(screen.getByRole("button", { name: "Open Cake" }));

    expect(mockRouter.navigate).toHaveBeenCalledWith({
      pathname: "/recipe/[id]",
      params: { id: "cake" },
    });
  });

  it("navigates rather than pushing, so one recipe screen is ever open", async () => {
    await seedStorage({ recipes: [bread] });
    renderWithProviders(<RecipesScreen />);

    await waitFor(() => expect(screen.getByText("Bread")).toBeVisible());
    fireEvent.press(screen.getByRole("button", { name: "Open Bread" }));

    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
