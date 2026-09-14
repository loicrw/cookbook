import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { resetRouterMock } from "@/src/test-utils/router";
import BasketScreen from "@/app/(tabs)/basket";
import { AppData } from "@/src/types/app";
import {
  makeManualItem,
  makeRecipe,
  renderWithProviders,
  seedStorage,
} from "@/src/test-utils";

const bread = makeRecipe({
  id: "bread",
  ingredients: [
    { amount: 500, name: "flour", unit: "g" },
    { amount: "to taste", name: "salt" },
  ],
  people_served: 4,
  title: "Bread",
});

const cake = makeRecipe({
  id: "cake",
  ingredients: [{ amount: 100, name: "flour", unit: "g" }],
  people_served: 2,
  title: "Cake",
});

beforeEach(() => resetRouterMock());

/** Renders the basket over the given stored data and waits for it to settle. */
async function renderBasket(data: Partial<AppData> = {}) {
  await seedStorage(data);
  renderWithProviders(<BasketScreen />);
  await waitFor(() => expect(screen.queryByTestId("loading-screen")).toBeNull());
}

describe("the basket screen", () => {
  it("waits for storage before drawing anything", async () => {
    await seedStorage({ recipes: [bread] });
    renderWithProviders(<BasketScreen />);

    expect(screen.getByTestId("loading-screen")).toBeVisible();
    await waitFor(() =>
      expect(screen.queryByTestId("loading-screen")).toBeNull()
    );
  });

  describe("with nothing on the list", () => {
    it("says so, and points at both ways of adding something", async () => {
      await renderBasket();

      expect(screen.getByText("No recipes on the list")).toBeVisible();
      expect(
        screen.getByText(/Open a recipe and tap the basket button/)
      ).toBeVisible();
    });

    it("still offers the controls for adding a line by hand", async () => {
      await renderBasket();

      expect(screen.getByLabelText("Item")).toBeVisible();
      expect(screen.getByRole("button", { name: "Add item" })).toBeVisible();
    });

    it("offers nothing to finish, there being nothing to shop for", async () => {
      await renderBasket();

      expect(screen.queryByText("Done!")).toBeNull();
    });
  });

  describe("with recipes on the list", () => {
    const withBread = {
      basket: {
        entries: [{ recipeId: "bread", servings: 4 }],
        manualItems: [],
        ticked: [],
      },
      recipes: [bread, cake],
    };

    it("lists each recipe with the servings it is on the list for", async () => {
      await renderBasket(withBread);

      expect(screen.getByText("Bread")).toBeVisible();
      expect(
        screen.getByRole("button", { name: "More servings of Bread" })
      ).toBeVisible();
    });

    it("shows the ingredients those recipes call for", async () => {
      await renderBasket(withBread);

      expect(screen.getByText("500 g flour")).toBeVisible();
      expect(screen.getByText("salt (to taste)")).toBeVisible();
    });

    it("rescales the amounts when the servings change", async () => {
      await renderBasket(withBread);

      fireEvent.press(
        screen.getByRole("button", { name: "More servings of Bread" })
      );

      await waitFor(() => expect(screen.getByText("625 g flour")).toBeVisible());
    });

    it("merges what two recipes both call for", async () => {
      await renderBasket({
        basket: {
          entries: [
            { recipeId: "bread", servings: 4 },
            { recipeId: "cake", servings: 2 },
          ],
          manualItems: [],
          ticked: [],
        },
        recipes: [bread, cake],
      });

      expect(screen.getByText("600 g flour")).toBeVisible();
    });

    it("counts what is on the list and where it came from", async () => {
      await renderBasket(withBread);

      expect(screen.getByText("2 items from 1 recipe.")).toBeVisible();
    });

    it("takes a recipe off the list", async () => {
      await renderBasket(withBread);

      fireEvent.press(
        screen.getByRole("button", { name: "Remove Bread from the basket" })
      );

      await waitFor(() =>
        expect(screen.getByText("No recipes on the list")).toBeVisible()
      );
      expect(screen.queryByText("500 g flour")).toBeNull();
    });

    it("ticks a line off, and keeps it ticked", async () => {
      await renderBasket(withBread);

      const line = screen.getByRole("checkbox", { name: "500 g flour" });
      expect(line).not.toBeChecked();

      fireEvent.press(line);

      await waitFor(() =>
        expect(
          screen.getByRole("checkbox", { name: "500 g flour" })
        ).toBeChecked()
      );
    });

    it("shows a line already ticked before the shop was interrupted", async () => {
      await renderBasket({
        ...withBread,
        basket: { ...withBread.basket, ticked: ["flour|g|false"] },
      });

      expect(
        screen.getByRole("checkbox", { name: "500 g flour" })
      ).toBeChecked();
    });
  });

  describe("lines added by hand", () => {
    it("puts one on the list", async () => {
      await renderBasket();

      fireEvent.changeText(screen.getByLabelText("Item"), "bin bags");
      fireEvent.press(screen.getByRole("button", { name: "Add item" }));

      await waitFor(() => expect(screen.getByText("bin bags")).toBeVisible());
    });

    it("puts a measured one on the list", async () => {
      await renderBasket();

      fireEvent.changeText(screen.getByLabelText("Item"), "potatoes");
      fireEvent.changeText(screen.getByLabelText("Amount (optional)"), "2");
      fireEvent.changeText(screen.getByLabelText("Unit (optional)"), "kg");
      fireEvent.press(screen.getByRole("button", { name: "Add item" }));

      await waitFor(() =>
        expect(screen.getByText("2 kg potatoes")).toBeVisible()
      );
    });

    it("ticks one off", async () => {
      const item = makeManualItem({ name: "bin bags" });
      await renderBasket({
        basket: { entries: [], manualItems: [item], ticked: [] },
      });

      fireEvent.press(screen.getByRole("checkbox", { name: "bin bags" }));

      await waitFor(() =>
        expect(screen.getByRole("checkbox", { name: "bin bags" })).toBeChecked()
      );
    });

    it("takes one off the list", async () => {
      const item = makeManualItem({ name: "bin bags" });
      await renderBasket({
        basket: { entries: [], manualItems: [item], ticked: [] },
      });

      fireEvent.press(
        screen.getByRole("button", { name: "Remove bin bags from the list" })
      );

      await waitFor(() => expect(screen.queryByText("bin bags")).toBeNull());
    });

    it("keeps two lines of the same name apart", async () => {
      await renderBasket({
        basket: {
          entries: [],
          manualItems: [
            makeManualItem({ id: "a", name: "milk" }),
            makeManualItem({ id: "b", name: "milk" }),
          ],
          ticked: [],
        },
      });

      const lines = screen.getAllByRole("checkbox", { name: "milk" });
      expect(lines).toHaveLength(2);

      fireEvent.press(lines[0]);

      await waitFor(() => {
        const after = screen.getAllByRole("checkbox", { name: "milk" });
        expect(after[0]).toBeChecked();
        expect(after[1]).not.toBeChecked();
      });
    });
  });

  describe("finishing the shop", () => {
    it("counts every line, of both kinds", async () => {
      await renderBasket({
        basket: {
          entries: [{ recipeId: "bread", servings: 4 }],
          manualItems: [makeManualItem({ name: "bin bags" })],
          ticked: [],
        },
        recipes: [bread],
      });

      expect(
        screen.getByText(/3 items to shop for\. Ticks are kept until you are/)
      ).toBeVisible();
    });

    it("empties the whole list when the shop is done", async () => {
      await renderBasket({
        basket: {
          entries: [{ recipeId: "bread", servings: 4 }],
          manualItems: [makeManualItem({ name: "bin bags" })],
          ticked: [],
        },
        recipes: [bread],
      });

      fireEvent.press(screen.getByText("Done!"));

      await waitFor(() =>
        expect(screen.getByText("No recipes on the list")).toBeVisible()
      );
      expect(screen.queryByText("bin bags")).toBeNull();
      expect(screen.queryByText("Done!")).toBeNull();
    });
  });
});
